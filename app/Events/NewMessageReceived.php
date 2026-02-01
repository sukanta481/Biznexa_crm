<?php

namespace App\Events;

use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewMessageReceived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Message $message;
    public Conversation $conversation;
    public Contact $contact;
    public bool $isNewSession;

    /**
     * Create a new event instance.
     */
    public function __construct(
        Message $message,
        Conversation $conversation,
        Contact $contact,
        bool $isNewSession = false
    ) {
        $this->message = $message;
        $this->conversation = $conversation;
        $this->contact = $contact;
        $this->isNewSession = $isNewSession;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('inbox'),
            new PrivateChannel('conversation.' . $this->conversation->id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'message.received';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'message' => [
                'id' => $this->message->id,
                'wam_id' => $this->message->wam_id,
                'conversation_id' => $this->message->conversation_id,
                'type' => $this->message->type,
                'direction' => $this->message->direction,
                'body' => $this->message->body,
                'caption' => $this->message->caption,
                'media_url' => $this->message->media_url,
                'media_mime_type' => $this->message->media_mime_type,
                'latitude' => $this->message->latitude,
                'longitude' => $this->message->longitude,
                'status' => $this->message->status,
                'created_at' => $this->message->created_at->toISOString(),
            ],
            'conversation' => [
                'id' => $this->conversation->id,
                'contact_id' => $this->conversation->contact_id,
                'status' => $this->conversation->status,
                'unread_count' => $this->conversation->unread_count,
                'last_interaction_at' => $this->conversation->last_interaction_at?->toISOString(),
                'last_customer_message_at' => $this->conversation->last_customer_message_at?->toISOString(),
            ],
            'contact' => [
                'id' => $this->contact->id,
                'name' => $this->contact->name,
                'whatsapp_id' => $this->contact->whatsapp_id,
            ],
            'is_new_session' => $this->isNewSession,
        ];
    }
}
