<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConversationController extends Controller
{
    /**
     * Display a listing of conversations (Chat page).
     */
    public function index(Request $request)
    {
        $conversations = Conversation::with(['contact', 'latestMessage', 'assignedUser'])
            ->withCount('messages')
            ->orderByDesc('last_interaction_at')
            ->orderByDesc('updated_at')
            ->paginate(20);

        // If a conversation is selected, load its messages
        $activeConversation = null;
        $messages = [];

        if ($request->filled('conversation')) {
            $activeConversation = Conversation::with('contact')
                ->find($request->conversation);
            
            if ($activeConversation) {
                $messages = $activeConversation->messages()
                    ->orderBy('created_at', 'asc')
                    ->get();
            }
        }

        return Inertia::render('Chat/Index', [
            'conversations' => $conversations,
            'activeConversation' => $activeConversation,
            'messages' => $messages,
        ]);
    }

    /**
     * Get conversations list as JSON (for AJAX/useChat hook).
     */
    public function list()
    {
        $conversations = Conversation::with(['contact', 'latestMessage', 'assignedUser'])
            ->withCount('messages')
            ->orderByDesc('last_interaction_at')
            ->orderByDesc('updated_at')
            ->get();

        return response()->json($conversations);
    }

    /**
     * Get messages for a specific conversation (API endpoint).
     */
    public function messages(Conversation $conversation)
    {
        $messages = $conversation->messages()
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    /**
     * Send a message in a conversation.
     */
    public function sendMessage(Request $request, Conversation $conversation)
    {
        $validated = $request->validate([
            'body' => 'required|string|max:4096',
            'type' => 'in:text,image,template',
        ]);

        $message = $conversation->messages()->create([
            'type' => $validated['type'] ?? 'text',
            'direction' => 'outbound',
            'body' => $validated['body'],
            'status' => 'sent',
        ]);

        return response()->json($message);
    }

    /**
     * Close a conversation.
     */
    public function close(Conversation $conversation)
    {
        $conversation->update(['status' => 'closed']);

        return redirect()->back()
            ->with('success', 'Conversation closed.');
    }

    /**
     * Reopen a conversation.
     */
    public function reopen(Conversation $conversation)
    {
        $conversation->update(['status' => 'open']);

        return redirect()->back()
            ->with('success', 'Conversation reopened.');
    }

    /**
     * Assign conversation to current user (Take Over).
     * Sets assigned_to_user_id to authenticated user and disables AI.
     */
    public function assignChat(Conversation $conversation)
    {
        $conversation->update([
            'assigned_to_user_id' => auth()->id(),
            'is_ai_active' => false,
        ]);

        // Load relationships for response
        $conversation->load(['contact', 'assignedUser']);

        return response()->json([
            'success' => true,
            'message' => 'Conversation assigned to you. AI has been disabled.',
            'conversation' => $conversation,
        ]);
    }

    /**
     * Mark conversation as read.
     */
    public function markAsRead(Conversation $conversation)
    {
        $conversation->update(['unread_count' => 0]);
        
        // Mark all inbound messages as read
        $conversation->messages()
            ->where('direction', 'inbound')
            ->where('status', '!=', 'read')
            ->update(['status' => 'read']);

        return response()->json(['success' => true]);
    }

    /**
     * Toggle AI active state.
     */
    public function toggleAI(Request $request, Conversation $conversation)
    {
        $conversation->update([
            'is_ai_active' => !$conversation->is_ai_active,
        ]);

        $conversation->load(['contact', 'assignedUser']);

        return response()->json([
            'success' => true,
            'conversation' => $conversation,
        ]);
    }
}
