<?php

namespace App\Jobs;

use App\Events\NewMessageReceived;
use App\Jobs\GenerateAIResponse;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessIncomingMessage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public int $backoff = 10;

    /**
     * The maximum number of unhandled exceptions to allow before failing.
     */
    public int $maxExceptions = 2;

    /**
     * Raw webhook data from WhatsApp.
     */
    public array $rawWebhookData;

    /**
     * Create a new job instance.
     * 
     * @param array $rawWebhookData The raw webhook payload from Meta
     */
    public function __construct(array $rawWebhookData)
    {
        $this->rawWebhookData = $rawWebhookData;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // 1. Parse the raw webhook data
            $parsedData = $this->parseWebhookData();
            
            if (!$parsedData) {
                Log::warning('Could not parse webhook data', [
                    'raw_data' => $this->rawWebhookData,
                ]);
                return;
            }

            // Use database transaction for data integrity
            $result = DB::transaction(function () use ($parsedData) {
                // 2. Find or create contact
                $contact = $this->findOrCreateContact($parsedData);

                // 3. Find or create active conversation
                $conversation = $this->findOrCreateConversation($contact);

                // 4. Save the message to database
                $message = $this->createMessage($conversation, $parsedData);

                // 5. Update contact's last active timestamp
                $contact->update(['last_active_at' => now()]);

                return [
                    'contact' => $contact,
                    'conversation' => $conversation,
                    'message' => $message,
                ];
            });

            // Extract results from transaction
            $contact = $result['contact'];
            $conversation = $result['conversation'];
            $message = $result['message'];

            Log::info('WhatsApp message processed', [
                'contact_id' => $contact->id,
                'conversation_id' => $conversation->id,
                'message_id' => $message->id,
                'whatsapp_message_id' => $parsedData['message_id'],
            ]);

            // 6. Broadcast real-time event to frontend (Laravel Reverb/Pusher)
            $this->broadcastNewMessage($message, $contact, $conversation);

            // 7. Trigger AI response if AI is active for this conversation
            if ($conversation->is_ai_active) {
                $this->dispatchAIResponse($message, $conversation, $contact);
            }

        } catch (\Exception $e) {
            Log::error('Failed to process WhatsApp message', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'raw_data' => $this->rawWebhookData,
            ]);

            throw $e; // Re-throw to trigger retry
        }
    }

    /**
     * Parse the raw webhook data to extract phone number and message body.
     */
    private function parseWebhookData(): ?array
    {
        $data = $this->rawWebhookData;

        // Handle pre-parsed data (from controller)
        if (isset($data['whatsapp_id']) && isset($data['message_id'])) {
            return $data;
        }

        // Handle raw Meta webhook format
        if (!isset($data['entry'][0]['changes'][0]['value'])) {
            return null;
        }

        $value = $data['entry'][0]['changes'][0]['value'];

        if (!isset($value['messages'][0])) {
            return null;
        }

        $message = $value['messages'][0];
        $contacts = $value['contacts'] ?? [];

        // Get contact name from contacts array
        $contactName = 'Unknown';
        foreach ($contacts as $contact) {
            if (($contact['wa_id'] ?? '') === ($message['from'] ?? '')) {
                $contactName = $contact['profile']['name'] ?? 'Unknown';
                break;
            }
        }

        return [
            'whatsapp_id' => $message['from'] ?? null,
            'contact_name' => $contactName,
            'message_id' => $message['id'] ?? null,
            'timestamp' => $message['timestamp'] ?? now()->timestamp,
            'type' => $message['type'] ?? 'text',
            'body' => $this->extractMessageBody($message),
            'raw' => $message,
        ];
    }

    /**
     * Extract message body based on message type.
     */
    private function extractMessageBody(array $message): ?string
    {
        $type = $message['type'] ?? 'text';

        return match ($type) {
            'text' => $message['text']['body'] ?? null,
            'image' => $message['image']['caption'] ?? '[Image]',
            'video' => $message['video']['caption'] ?? '[Video]',
            'audio' => '[Audio Message]',
            'document' => $message['document']['filename'] ?? '[Document]',
            'location' => sprintf(
                '[Location: %s, %s]',
                $message['location']['latitude'] ?? 0,
                $message['location']['longitude'] ?? 0
            ),
            'contacts' => '[Contact Card]',
            'sticker' => '[Sticker]',
            'interactive' => $message['interactive']['button_reply']['title'] 
                ?? $message['interactive']['list_reply']['title'] 
                ?? '[Interactive Response]',
            default => null,
        };
    }

    /**
     * Find existing contact or create a new one.
     */
    private function findOrCreateContact(array $parsedData): Contact
    {
        return Contact::firstOrCreate(
            ['whatsapp_id' => $parsedData['whatsapp_id']],
            [
                'name' => $parsedData['contact_name'],
                'status' => 'new',
                'last_active_at' => now(),
            ]
        );
    }

    /**
     * Find an open conversation or create a new one.
     */
    private function findOrCreateConversation(Contact $contact): Conversation
    {
        // Look for an existing open conversation
        $conversation = Conversation::where('contact_id', $contact->id)
            ->where('status', 'open')
            ->first();

        if (!$conversation) {
            $conversation = Conversation::create([
                'contact_id' => $contact->id,
                'assigned_to_user_id' => null,
                'is_ai_active' => true,
                'status' => 'open',
            ]);
        }

        return $conversation;
    }

    /**
     * Save the message to database.
     */
    private function createMessage(Conversation $conversation, array $parsedData): Message
    {
        return Message::create([
            'conversation_id' => $conversation->id,
            'type' => $this->mapMessageType($parsedData['type']),
            'direction' => 'inbound',
            'body' => $parsedData['body'],
            'meta_id' => $parsedData['message_id'],
            'status' => 'delivered',
        ]);
    }

    /**
     * Map WhatsApp message type to our simplified types.
     */
    private function mapMessageType(string $whatsappType): string
    {
        return match ($whatsappType) {
            'text', 'interactive' => 'text',
            'image', 'video', 'audio', 'document', 'sticker' => 'image',
            default => 'text',
        };
    }

    /**
     * Broadcast NewMessageReceived event for real-time frontend updates.
     * Uses Laravel Reverb, Pusher, or any configured broadcast driver.
     */
    private function broadcastNewMessage(Message $message, Contact $contact, Conversation $conversation): void
    {
        try {
            // Load relationships for the broadcast payload
            $message->load('conversation.contact');

            // Dispatch the broadcast event
            event(new NewMessageReceived(
                $message,
                $contact,
                $conversation
            ));

            Log::debug('Message broadcast sent', [
                'message_id' => $message->id,
                'conversation_id' => $conversation->id,
            ]);

        } catch (\Exception $e) {
            // Don't fail the job if broadcasting fails
            Log::warning('Failed to broadcast message', [
                'error' => $e->getMessage(),
                'message_id' => $message->id,
            ]);
        }
    }

    /**
     * Dispatch AI response generation job.
     */
    private function dispatchAIResponse(Message $message, Conversation $conversation, Contact $contact): void
    {
        GenerateAIResponse::dispatch($message, $conversation, $contact)
            ->onQueue('ai-responses')
            ->delay(now()->addSeconds(1)); // Small delay for natural feel

        Log::info('AI response job dispatched', [
            'message_id' => $message->id,
            'conversation_id' => $conversation->id,
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::critical('WhatsApp message processing failed permanently', [
            'error' => $exception->getMessage(),
            'raw_data' => $this->rawWebhookData,
        ]);

        // TODO: Store in failed_messages table for manual review
        // TODO: Send alert to admin via Slack/email
    }
}
