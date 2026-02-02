<?php

namespace App\Http\Controllers\Api;

use App\Events\MessageStatusUpdated;
use App\Events\NewMessageReceived;
use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WhatsAppWebhookController extends Controller
{
    protected WhatsAppService $whatsAppService;

    public function __construct(WhatsAppService $whatsAppService)
    {
        $this->whatsAppService = $whatsAppService;
    }

    /**
     * Verify webhook endpoint (GET request from Meta).
     * Meta sends this when setting up the webhook.
     */
    public function verify(Request $request)
    {
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        // Get verify token from database, fallback to config
        $verifyToken = \App\Models\Setting::get('whatsapp_webhook_verify_token') 
            ?? config('services.whatsapp.webhook_verify_token', '');

        Log::info('WhatsApp webhook verification attempt', [
            'mode' => $mode,
            'received_token' => substr($token ?? '', 0, 20) . '...',
            'expected_token' => substr($verifyToken ?? '', 0, 20) . '...',
            'challenge' => $challenge,
        ]);

        if ($mode === 'subscribe' && $token === $verifyToken) {
            Log::info('WhatsApp webhook verified successfully');
            return response($challenge, 200)->header('Content-Type', 'text/plain');
        }

        Log::warning('WhatsApp webhook verification failed', [
            'mode' => $mode,
            'token_match' => $token === $verifyToken,
        ]);

        return response('Verification failed', 403);
    }

    /**
     * Handle incoming webhook events (POST request from Meta).
     */
    public function handle(Request $request)
    {
        $payload = $request->all();

        Log::debug('WhatsApp webhook received', ['payload' => $payload]);

        // Always respond 200 OK immediately to prevent Meta retries
        // Process in background if needed for heavy operations

        try {
            // Extract the entry data
            $entries = $payload['entry'] ?? [];

            foreach ($entries as $entry) {
                $changes = $entry['changes'] ?? [];

                foreach ($changes as $change) {
                    if ($change['field'] !== 'messages') {
                        continue;
                    }

                    $value = $change['value'] ?? [];

                    // Handle incoming messages
                    if (!empty($value['messages'])) {
                        foreach ($value['messages'] as $messageData) {
                            $this->processIncomingMessage($messageData, $value);
                        }
                    }

                    // Handle status updates (sent, delivered, read)
                    if (!empty($value['statuses'])) {
                        foreach ($value['statuses'] as $statusData) {
                            $this->processStatusUpdate($statusData);
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('WhatsApp webhook processing error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }

        return response()->json(['status' => 'received'], 200);
    }

    /**
     * Process an incoming message from WhatsApp.
     */
    protected function processIncomingMessage(array $messageData, array $value): void
    {
        $wamId = $messageData['id'] ?? null;

        // IDEMPOTENCY CHECK: Skip if we've already processed this message
        if ($wamId && Message::where('wam_id', $wamId)->exists()) {
            Log::debug('Duplicate message skipped', ['wam_id' => $wamId]);
            return;
        }

        // Extract sender info
        $senderPhone = $messageData['from'] ?? null;
        if (!$senderPhone) {
            Log::warning('Message without sender phone', ['data' => $messageData]);
            return;
        }

        // Get contact profile from payload
        $contacts = $value['contacts'] ?? [];
        $profileName = $contacts[0]['profile']['name'] ?? null;

        // Find or create contact
        $contact = Contact::updateOrCreate(
            ['whatsapp_id' => $senderPhone],
            [
                'name' => $profileName ?? $senderPhone,
                'phone_number' => $senderPhone,
                'profile_name' => $profileName,
                'last_active_at' => now(),
            ]
        );

        // Find or create conversation
        $conversation = Conversation::firstOrCreate(
            [
                'contact_id' => $contact->id,
                'status' => 'open',
            ],
            [
                'is_ai_active' => true,
            ]
        );

        // Check if 24-hour window expired (new session)
        $lastCustomerMessage = $conversation->last_customer_message_at;
        $isNewSession = false;

        if ($lastCustomerMessage) {
            $hoursSinceLastMessage = Carbon::parse($lastCustomerMessage)->diffInHours(now());
            if ($hoursSinceLastMessage > 24) {
                $isNewSession = true;
                Log::info('New session started (24-hour window expired)', [
                    'contact_id' => $contact->id,
                    'hours_since_last' => $hoursSinceLastMessage,
                ]);
            }
        }

        // Update conversation timestamps
        $conversation->update([
            'last_customer_message_at' => now(),
            'last_interaction_at' => now(),
            'unread_count' => $conversation->unread_count + 1,
            'status' => 'open', // Reopen if closed
        ]);

        // Parse message type and content
        $messageType = $messageData['type'] ?? 'text';
        $parsedMessage = $this->parseMessageContent($messageData, $messageType);

        // Create message record
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'wam_id' => $wamId,
            'type' => $parsedMessage['type'],
            'direction' => 'inbound',
            'body' => $parsedMessage['body'],
            'caption' => $parsedMessage['caption'],
            'media_id' => $parsedMessage['media_id'],
            'media_mime_type' => $parsedMessage['mime_type'],
            'media_filename' => $parsedMessage['filename'],
            'latitude' => $parsedMessage['latitude'],
            'longitude' => $parsedMessage['longitude'],
            'location_name' => $parsedMessage['location_name'],
            'location_address' => $parsedMessage['location_address'],
            'status' => 'delivered',
        ]);

        // Download media if present
        if ($parsedMessage['media_id']) {
            $this->downloadMedia($message, $parsedMessage['media_id']);
        }

        // Mark message as read in WhatsApp
        if ($wamId) {
            $this->whatsAppService->markAsRead($wamId);
        }

        // Broadcast event for real-time UI update
        broadcast(new NewMessageReceived($message, $conversation, $contact, $isNewSession));

        Log::info('Incoming message processed', [
            'message_id' => $message->id,
            'wam_id' => $wamId,
            'contact' => $contact->whatsapp_id,
            'type' => $messageType,
        ]);
    }

    /**
     * Parse message content based on type.
     */
    protected function parseMessageContent(array $messageData, string $type): array
    {
        $result = [
            'type' => $this->mapMessageType($type),
            'body' => null,
            'caption' => null,
            'media_id' => null,
            'mime_type' => null,
            'filename' => null,
            'latitude' => null,
            'longitude' => null,
            'location_name' => null,
            'location_address' => null,
        ];

        switch ($type) {
            case 'text':
                $result['body'] = $messageData['text']['body'] ?? null;
                break;

            case 'image':
                $image = $messageData['image'] ?? [];
                $result['media_id'] = $image['id'] ?? null;
                $result['mime_type'] = $image['mime_type'] ?? 'image/jpeg';
                $result['caption'] = $image['caption'] ?? null;
                break;

            case 'document':
                $doc = $messageData['document'] ?? [];
                $result['media_id'] = $doc['id'] ?? null;
                $result['mime_type'] = $doc['mime_type'] ?? null;
                $result['filename'] = $doc['filename'] ?? null;
                $result['caption'] = $doc['caption'] ?? null;
                break;

            case 'audio':
                $audio = $messageData['audio'] ?? [];
                $result['media_id'] = $audio['id'] ?? null;
                $result['mime_type'] = $audio['mime_type'] ?? 'audio/ogg';
                break;

            case 'video':
                $video = $messageData['video'] ?? [];
                $result['media_id'] = $video['id'] ?? null;
                $result['mime_type'] = $video['mime_type'] ?? 'video/mp4';
                $result['caption'] = $video['caption'] ?? null;
                break;

            case 'sticker':
                $sticker = $messageData['sticker'] ?? [];
                $result['media_id'] = $sticker['id'] ?? null;
                $result['mime_type'] = $sticker['mime_type'] ?? 'image/webp';
                break;

            case 'location':
                $location = $messageData['location'] ?? [];
                $result['latitude'] = $location['latitude'] ?? null;
                $result['longitude'] = $location['longitude'] ?? null;
                $result['location_name'] = $location['name'] ?? null;
                $result['location_address'] = $location['address'] ?? null;
                $result['body'] = "📍 Location shared";
                break;

            case 'contacts':
                $result['body'] = "📇 Contact shared";
                break;

            case 'interactive':
                $interactive = $messageData['interactive'] ?? [];
                $buttonReply = $interactive['button_reply'] ?? [];
                $listReply = $interactive['list_reply'] ?? [];
                $result['body'] = $buttonReply['title'] ?? $listReply['title'] ?? 'Interactive response';
                break;

            case 'reaction':
                $reaction = $messageData['reaction'] ?? [];
                $result['body'] = $reaction['emoji'] ?? '👍';
                break;

            default:
                $result['body'] = "[Unsupported message type: {$type}]";
        }

        return $result;
    }

    /**
     * Map WhatsApp message type to our enum.
     */
    protected function mapMessageType(string $type): string
    {
        $mapping = [
            'text' => 'text',
            'image' => 'image',
            'document' => 'document',
            'audio' => 'audio',
            'video' => 'video',
            'sticker' => 'sticker',
            'location' => 'location',
            'contacts' => 'contacts',
            'interactive' => 'interactive',
            'reaction' => 'reaction',
        ];

        return $mapping[$type] ?? 'text';
    }

    /**
     * Download and store media from WhatsApp.
     */
    protected function downloadMedia(Message $message, string $mediaId): void
    {
        try {
            $mediaUrl = $this->whatsAppService->getMediaUrl($mediaId);
            if ($mediaUrl) {
                $message->update(['media_url' => $mediaUrl]);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to download media', [
                'message_id' => $message->id,
                'media_id' => $mediaId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Process message status updates (sent, delivered, read).
     */
    protected function processStatusUpdate(array $statusData): void
    {
        $wamId = $statusData['id'] ?? null;
        $status = $statusData['status'] ?? null;

        if (!$wamId || !$status) {
            return;
        }

        // Map WhatsApp status to our enum
        $statusMap = [
            'sent' => 'sent',
            'delivered' => 'delivered',
            'read' => 'read',
            'failed' => 'failed',
        ];

        $mappedStatus = $statusMap[$status] ?? null;
        if (!$mappedStatus) {
            return;
        }

        // Update message status
        $message = Message::where('wam_id', $wamId)->first();
        if ($message) {
            $message->update(['status' => $mappedStatus]);

            // Broadcast status update for real-time UI
            broadcast(new MessageStatusUpdated($message));

            Log::debug('Message status updated', [
                'wam_id' => $wamId,
                'status' => $mappedStatus,
            ]);
        }
    }
}
