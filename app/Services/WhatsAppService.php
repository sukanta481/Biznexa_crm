<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    /**
     * WhatsApp Cloud API base URL.
     */
    protected string $baseUrl;

    /**
     * Phone Number ID from Meta.
     */
    protected string $phoneNumberId;

    /**
     * Access token for authentication.
     */
    protected string $accessToken;

    /**
     * Create a new WhatsAppService instance.
     * Reads from database settings first, then falls back to .env config.
     */
    public function __construct()
    {
        $apiVersion = config('services.whatsapp.api_version', 'v18.0');
        
        // Try database settings first, then fall back to .env
        $this->phoneNumberId = Setting::get('whatsapp_phone_number_id') 
            ?? config('services.whatsapp.phone_number_id', '');
        $this->accessToken = Setting::get('whatsapp_access_token') 
            ?? config('services.whatsapp.access_token', '');
        
        $this->baseUrl = "https://graph.facebook.com/{$apiVersion}/{$this->phoneNumberId}";
    }

    /**
     * Send a text message to a WhatsApp user.
     *
     * @param string $recipientPhone The recipient's WhatsApp phone number (with country code)
     * @param string $messageBody The text message to send
     * @return array{success: bool, message_id: ?string, error: ?string}
     */
    public function sendTextMessage(string $recipientPhone, string $messageBody): array
    {
        if (!$this->isConfigured()) {
            Log::warning('WhatsApp API credentials not configured');
            return [
                'success' => false,
                'message_id' => null,
                'error' => 'WhatsApp API not configured',
            ];
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->accessToken,
                'Content-Type' => 'application/json',
            ])->timeout(30)->post("{$this->baseUrl}/messages", [
                'messaging_product' => 'whatsapp',
                'recipient_type' => 'individual',
                'to' => $recipientPhone,
                'type' => 'text',
                'text' => [
                    'preview_url' => false,
                    'body' => $messageBody,
                ],
            ]);

            if ($response->successful()) {
                $messageId = $response->json('messages.0.id');
                
                Log::info('WhatsApp message sent successfully', [
                    'recipient' => $this->maskPhone($recipientPhone),
                    'message_id' => $messageId,
                ]);

                return [
                    'success' => true,
                    'message_id' => $messageId,
                    'error' => null,
                ];
            }

            $error = $response->json('error.message') ?? 'Unknown error';
            
            Log::error('WhatsApp API error', [
                'status' => $response->status(),
                'error' => $error,
                'recipient' => $this->maskPhone($recipientPhone),
            ]);

            return [
                'success' => false,
                'message_id' => null,
                'error' => $error,
            ];

        } catch (\Exception $e) {
            Log::error('WhatsApp API exception', [
                'error' => $e->getMessage(),
                'recipient' => $this->maskPhone($recipientPhone),
            ]);

            return [
                'success' => false,
                'message_id' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Send an image message to a WhatsApp user.
     *
     * @param string $recipientPhone The recipient's WhatsApp phone number
     * @param string $imageUrl Public URL of the image
     * @param string|null $caption Optional caption for the image
     * @return array{success: bool, message_id: ?string, error: ?string}
     */
    public function sendImageMessage(string $recipientPhone, string $imageUrl, ?string $caption = null): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'message_id' => null,
                'error' => 'WhatsApp API not configured',
            ];
        }

        try {
            $payload = [
                'messaging_product' => 'whatsapp',
                'recipient_type' => 'individual',
                'to' => $recipientPhone,
                'type' => 'image',
                'image' => [
                    'link' => $imageUrl,
                ],
            ];

            if ($caption) {
                $payload['image']['caption'] = $caption;
            }

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->accessToken,
                'Content-Type' => 'application/json',
            ])->timeout(30)->post("{$this->baseUrl}/messages", $payload);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message_id' => $response->json('messages.0.id'),
                    'error' => null,
                ];
            }

            return [
                'success' => false,
                'message_id' => null,
                'error' => $response->json('error.message') ?? 'Unknown error',
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message_id' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Send a template message to a WhatsApp user.
     *
     * @param string $recipientPhone The recipient's WhatsApp phone number
     * @param string $templateName The approved template name
     * @param string $languageCode Language code (e.g., 'en_US')
     * @param array $components Optional template components
     * @return array{success: bool, message_id: ?string, error: ?string}
     */
    public function sendTemplateMessage(
        string $recipientPhone,
        string $templateName,
        string $languageCode = 'en_US',
        array $components = []
    ): array {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'message_id' => null,
                'error' => 'WhatsApp API not configured',
            ];
        }

        try {
            $payload = [
                'messaging_product' => 'whatsapp',
                'recipient_type' => 'individual',
                'to' => $recipientPhone,
                'type' => 'template',
                'template' => [
                    'name' => $templateName,
                    'language' => [
                        'code' => $languageCode,
                    ],
                ],
            ];

            if (!empty($components)) {
                $payload['template']['components'] = $components;
            }

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->accessToken,
                'Content-Type' => 'application/json',
            ])->timeout(30)->post("{$this->baseUrl}/messages", $payload);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message_id' => $response->json('messages.0.id'),
                    'error' => null,
                ];
            }

            return [
                'success' => false,
                'message_id' => null,
                'error' => $response->json('error.message') ?? 'Unknown error',
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message_id' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Mark a message as read.
     *
     * @param string $messageId The WhatsApp message ID to mark as read
     * @return bool
     */
    public function markAsRead(string $messageId): bool
    {
        if (!$this->isConfigured()) {
            return false;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->accessToken,
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/messages", [
                'messaging_product' => 'whatsapp',
                'status' => 'read',
                'message_id' => $messageId,
            ]);

            return $response->successful();

        } catch (\Exception $e) {
            Log::warning('Failed to mark message as read', [
                'message_id' => $messageId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Check if the WhatsApp service is properly configured.
     */
    public function isConfigured(): bool
    {
        return !empty($this->accessToken) && !empty($this->phoneNumberId);
    }

    /**
     * Mask phone number for logging (privacy).
     */
    private function maskPhone(string $phone): string
    {
        if (strlen($phone) <= 6) {
            return '***' . substr($phone, -2);
        }
        return substr($phone, 0, 3) . '***' . substr($phone, -3);
    }

    /**
     * Get media URL from WhatsApp API and download it.
     * WhatsApp media URLs expire in 5 minutes, so we download and store locally.
     *
     * @param string $mediaId The WhatsApp media ID
     * @return string|null The local public URL or null on failure
     */
    public function getMediaUrl(string $mediaId): ?string
    {
        if (!$this->isConfigured()) {
            Log::warning('WhatsApp API not configured for media retrieval');
            return null;
        }

        try {
            // Step 1: Get the media URL from WhatsApp API
            $apiVersion = config('services.whatsapp.api_version', 'v18.0');
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->accessToken,
            ])->get("https://graph.facebook.com/{$apiVersion}/{$mediaId}");

            if (!$response->successful()) {
                Log::error('Failed to get media URL from WhatsApp', [
                    'media_id' => $mediaId,
                    'status' => $response->status(),
                    'error' => $response->json('error.message'),
                ]);
                return null;
            }

            $mediaUrl = $response->json('url');
            $mimeType = $response->json('mime_type');

            if (!$mediaUrl) {
                Log::error('No URL in media response', ['media_id' => $mediaId]);
                return null;
            }

            // Step 2: Download the media file
            $downloadResponse = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->accessToken,
            ])->timeout(60)->get($mediaUrl);

            if (!$downloadResponse->successful()) {
                Log::error('Failed to download media', [
                    'media_id' => $mediaId,
                    'status' => $downloadResponse->status(),
                ]);
                return null;
            }

            // Step 3: Store locally
            $extension = $this->getExtensionFromMimeType($mimeType);
            $filename = 'whatsapp_' . $mediaId . '.' . $extension;
            $storagePath = 'whatsapp-media/' . date('Y/m/');
            
            // Ensure directory exists
            $fullPath = storage_path('app/public/' . $storagePath);
            if (!file_exists($fullPath)) {
                mkdir($fullPath, 0755, true);
            }

            // Save file
            file_put_contents($fullPath . $filename, $downloadResponse->body());

            // Return public URL
            $publicUrl = asset('storage/' . $storagePath . $filename);

            Log::info('Media downloaded successfully', [
                'media_id' => $mediaId,
                'path' => $storagePath . $filename,
            ]);

            return $publicUrl;

        } catch (\Exception $e) {
            Log::error('Exception while retrieving media', [
                'media_id' => $mediaId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Get file extension from MIME type.
     */
    private function getExtensionFromMimeType(?string $mimeType): string
    {
        $mapping = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'audio/ogg' => 'ogg',
            'audio/mpeg' => 'mp3',
            'audio/aac' => 'aac',
            'video/mp4' => 'mp4',
            'video/3gpp' => '3gp',
            'application/pdf' => 'pdf',
            'application/vnd.ms-excel' => 'xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
            'application/msword' => 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
        ];

        return $mapping[$mimeType] ?? 'bin';
    }

    /**
     * Get approved message templates from WhatsApp Business API.
     *
     * @return array{success: bool, templates: array, error: ?string}
     */
    public function getTemplates(): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'templates' => [],
                'error' => 'WhatsApp API not configured',
            ];
        }

        try {
            // Get the WhatsApp Business Account ID from settings
            $wabaid = Setting::get('whatsapp_business_account_id') 
                ?? config('services.whatsapp.business_account_id', '');
            
            if (empty($wabaid)) {
                Log::warning('WhatsApp Business Account ID not configured');
                return [
                    'success' => false,
                    'templates' => [],
                    'error' => 'WhatsApp Business Account ID not configured. Please add it in Settings.',
                ];
            }

            $apiVersion = config('services.whatsapp.api_version', 'v18.0');
            
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->accessToken,
            ])->get("https://graph.facebook.com/{$apiVersion}/{$wabaid}/message_templates", [
                'limit' => 100,
            ]);

            if ($response->successful()) {
                $data = $response->json('data', []);
                
                // Filter only approved templates
                $approvedTemplates = array_filter($data, function ($template) {
                    return ($template['status'] ?? '') === 'APPROVED';
                });

                return [
                    'success' => true,
                    'templates' => array_values($approvedTemplates),
                    'error' => null,
                ];
            }

            $error = $response->json('error.message') ?? 'Failed to fetch templates';
            Log::error('Failed to fetch WhatsApp templates', [
                'status' => $response->status(),
                'error' => $error,
            ]);

            return [
                'success' => false,
                'templates' => [],
                'error' => $error,
            ];

        } catch (\Exception $e) {
            Log::error('Exception while fetching templates', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'templates' => [],
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get the Phone Number ID.
     */
    public function getPhoneNumberId(): string
    {
        return $this->phoneNumberId;
    }

    /**
     * Get configuration status details for debugging.
     */
    public function getConfigStatus(): array
    {
        return [
            'is_configured' => $this->isConfigured(),
            'has_phone_number_id' => !empty($this->phoneNumberId),
            'has_access_token' => !empty($this->accessToken),
            'phone_number_id' => $this->phoneNumberId ? substr($this->phoneNumberId, 0, 6) . '...' : null,
            'base_url' => $this->baseUrl,
        ];
    }
}
