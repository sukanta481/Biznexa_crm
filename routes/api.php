<?php

use App\Http\Controllers\Api\WhatsAppWebhookController;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

/*
|--------------------------------------------------------------------------
| WhatsApp Webhook Routes
|--------------------------------------------------------------------------
*/

// Webhook verification (GET) and message handler (POST)
Route::get('/whatsapp/webhook', [WhatsAppWebhookController::class, 'verify']);
Route::post('/whatsapp/webhook', [WhatsAppWebhookController::class, 'handle']);

/*
|--------------------------------------------------------------------------
| Conversation API Routes (for React frontend)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:web')->group(function () {
    // Get all conversations with latest message and contact
    Route::get('/conversations', function (Request $request) {
        $conversations = Conversation::with(['contact', 'latestMessage', 'assignedUser'])
            ->withCount(['messages as unread_count' => function ($query) {
                $query->where('direction', 'inbound')
                      ->where('status', '!=', 'read');
            }])
            ->orderByDesc('last_interaction_at')
            ->orderByDesc('updated_at')
            ->get();

        return response()->json(['data' => $conversations]);
    });

    // Get messages for a conversation
    Route::get('/conversations/{conversation}/messages', function (Conversation $conversation) {
        $messages = $conversation->messages()
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json(['data' => $messages]);
    });

    // Send a message in a conversation
    Route::post('/conversations/{conversation}/messages', function (Request $request, Conversation $conversation) {
        $validated = $request->validate([
            'body' => 'required|string|max:4096',
        ]);

        // Create outbound message
        $message = $conversation->messages()->create([
            'type' => 'text',
            'direction' => 'outbound',
            'body' => $validated['body'],
            'status' => 'pending',
        ]);

        // Send via WhatsApp API
        $whatsApp = app(\App\Services\WhatsAppService::class);
        $result = $whatsApp->sendTextMessage(
            $conversation->contact->whatsapp_id,
            $validated['body']
        );

        // Update message with result
        if ($result['success']) {
            $message->update([
                'wam_id' => $result['message_id'],
                'status' => 'sent',
            ]);
        } else {
            $message->update(['status' => 'failed']);
        }

        // Update conversation last interaction
        $conversation->update(['last_interaction_at' => now()]);

        return response()->json($message->fresh());
    });

    // Mark conversation as read
    Route::post('/conversations/{conversation}/read', function (Conversation $conversation) {
        $conversation->update(['unread_count' => 0]);
        
        // Mark all inbound messages as read
        $conversation->messages()
            ->where('direction', 'inbound')
            ->where('status', '!=', 'read')
            ->update(['status' => 'read']);

        return response()->json(['success' => true]);
    });

    // Update conversation (AI toggle, etc.)
    Route::patch('/conversations/{conversation}', function (Request $request, Conversation $conversation) {
        $validated = $request->validate([
            'is_ai_active' => 'sometimes|boolean',
            'status' => 'sometimes|in:open,closed',
        ]);

        $conversation->update($validated);

        return response()->json($conversation->fresh());
    });

    // Create new contact and conversation
    Route::post('/contacts', function (Request $request) {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'whatsapp_id' => 'required|string|max:20',
            ]);

            // Check if contact already exists
            $existingContact = \App\Models\Contact::where('whatsapp_id', $validated['whatsapp_id'])->first();
            
            if ($existingContact) {
                // Find or create conversation for existing contact
                $conversation = Conversation::firstOrCreate(
                    ['contact_id' => $existingContact->id],
                    [
                        'status' => 'open',
                        'is_ai_active' => true,
                    ]
                );

                return response()->json([
                    'success' => true,
                    'message' => 'Contact already exists',
                    'contact_id' => $existingContact->id,
                    'conversation_id' => $conversation->id,
                ]);
            }

            // Create new contact
            $contact = \App\Models\Contact::create([
                'name' => $validated['name'],
                'whatsapp_id' => $validated['whatsapp_id'],
                'phone_number' => $validated['whatsapp_id'],
            ]);

            // Create conversation for the contact
            $conversation = Conversation::create([
                'contact_id' => $contact->id,
                'status' => 'open',
                'is_ai_active' => true,
                'assigned_to_user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Contact created successfully',
                'contact_id' => $contact->id,
                'conversation_id' => $conversation->id,
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Contact creation failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create contact: ' . $e->getMessage(),
            ], 500);
        }
    });
});

