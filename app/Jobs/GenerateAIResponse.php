<?php

namespace App\Jobs;

use App\Events\NewMessageReceived;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GenerateAIResponse implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 2;

    /**
     * The number of seconds to wait before retrying.
     */
    public int $backoff = 5;

    /**
     * The incoming message to respond to.
     */
    public Message $incomingMessage;

    /**
     * The conversation context.
     */
    public Conversation $conversation;

    /**
     * The contact who sent the message.
     */
    public Contact $contact;

    /**
     * Create a new job instance.
     */
    public function __construct(Message $incomingMessage, Conversation $conversation, Contact $contact)
    {
        $this->incomingMessage = $incomingMessage;
        $this->conversation = $conversation;
        $this->contact = $contact;
    }

    /**
     * Execute the job.
     */
    public function handle(WhatsAppService $whatsAppService): void
    {
        // Double-check AI is still active (user might have disabled it)
        $this->conversation->refresh();
        
        if (!$this->conversation->is_ai_active) {
            Log::info('AI response skipped - AI disabled for conversation', [
                'conversation_id' => $this->conversation->id,
            ]);
            return;
        }

        try {
            // 1. Fetch last 10 messages for context
            $conversationHistory = $this->fetchConversationHistory();

            // 2. Prepare system prompt for cosmetic shop
            $systemPrompt = $this->getSystemPrompt();

            // 3. Call OpenAI GPT-4o-mini
            $aiResponse = $this->callOpenAI($systemPrompt, $conversationHistory);

            if (empty($aiResponse)) {
                Log::warning('AI generated empty response', [
                    'conversation_id' => $this->conversation->id,
                ]);
                return;
            }

            // 4. Save AI's reply to messages table
            $outboundMessage = $this->saveAIMessage($aiResponse);

            // 5. Send reply via WhatsApp Cloud API
            $this->sendToWhatsApp($whatsAppService, $outboundMessage);

            // 6. Broadcast to frontend for real-time update
            $this->broadcastMessage($outboundMessage);

            Log::info('AI response generated and sent', [
                'conversation_id' => $this->conversation->id,
                'message_id' => $outboundMessage->id,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to generate AI response', [
                'error' => $e->getMessage(),
                'conversation_id' => $this->conversation->id,
            ]);

            throw $e;
        }
    }

    /**
     * Step 1: Fetch the last 10 messages for context.
     */
    private function fetchConversationHistory(): array
    {
        $messages = Message::where('conversation_id', $this->conversation->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->reverse();

        return $messages->map(function ($message) {
            return [
                'role' => $message->direction === 'inbound' ? 'user' : 'assistant',
                'content' => $message->body ?? '',
            ];
        })->values()->toArray();
    }

    /**
     * Step 2: Get the system prompt for cosmetic shop.
     */
    private function getSystemPrompt(): string
    {
        return <<<PROMPT
You are a helpful assistant for a cosmetic shop. Do not make medical claims.

Additional Guidelines:
- Be friendly, professional, and knowledgeable about beauty and skincare products
- Help customers find the right products for their skin type and concerns
- Provide ingredient information when asked
- Never claim that products can cure, treat, or diagnose any medical condition
- Recommend consulting a dermatologist for serious skin concerns
- Keep responses concise and WhatsApp-friendly (under 200 words)
- Use emojis sparingly to maintain a friendly tone ✨

Customer Information:
- Name: {$this->contact->name}
- WhatsApp: {$this->contact->whatsapp_id}
- Status: {$this->contact->status}
PROMPT;
    }

    /**
     * Step 3: Call OpenAI GPT-4o-mini API.
     */
    private function callOpenAI(string $systemPrompt, array $conversationHistory): ?string
    {
        $apiKey = config('services.openai.api_key');
        
        if (!$apiKey) {
            Log::error('OpenAI API key not configured');
            return null;
        }

        // Prepare messages array with system prompt
        $messages = array_merge(
            [['role' => 'system', 'content' => $systemPrompt]],
            $conversationHistory
        );

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(30)
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4o-mini',
                'messages' => $messages,
                'max_tokens' => 500,
                'temperature' => 0.7,
                'presence_penalty' => 0.1,
                'frequency_penalty' => 0.1,
            ]);

            if ($response->successful()) {
                $content = $response->json('choices.0.message.content');
                
                Log::debug('OpenAI response received', [
                    'tokens_used' => $response->json('usage.total_tokens'),
                    'model' => $response->json('model'),
                ]);

                return $content;
            }

            Log::error('OpenAI API error', [
                'status' => $response->status(),
                'error' => $response->json('error.message') ?? $response->body(),
            ]);

            return null;

        } catch (\Exception $e) {
            Log::error('OpenAI API exception', [
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Step 4: Save the AI's reply to the messages table.
     */
    private function saveAIMessage(string $responseText): Message
    {
        return Message::create([
            'conversation_id' => $this->conversation->id,
            'type' => 'text',
            'direction' => 'outbound',
            'body' => $responseText,
            'meta_id' => null, // Will be updated after WhatsApp API
            'status' => 'pending',
        ]);
    }

    /**
     * Step 5: Send the reply to WhatsApp Cloud API.
     */
    private function sendToWhatsApp(WhatsAppService $whatsAppService, Message $message): void
    {
        $result = $whatsAppService->sendTextMessage(
            $this->contact->whatsapp_id,
            $message->body
        );

        if ($result['success']) {
            $message->update([
                'meta_id' => $result['message_id'],
                'status' => 'sent',
            ]);
        } else {
            $message->update(['status' => 'failed']);
            
            Log::error('Failed to send WhatsApp message', [
                'error' => $result['error'],
                'message_id' => $message->id,
            ]);
        }
    }

    /**
     * Broadcast the AI message to frontend.
     */
    private function broadcastMessage(Message $message): void
    {
        try {
            event(new NewMessageReceived(
                $message,
                $this->contact,
                $this->conversation
            ));
        } catch (\Exception $e) {
            // Don't fail job if broadcast fails
            Log::warning('Failed to broadcast AI message', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::critical('AI response generation failed permanently', [
            'error' => $exception->getMessage(),
            'conversation_id' => $this->conversation->id,
            'incoming_message_id' => $this->incomingMessage->id,
        ]);

        // Optionally notify admin or mark conversation for manual follow-up
    }
}
