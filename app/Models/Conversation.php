<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'contact_id',
        'assigned_to_user_id',
        'is_ai_active',
        'status',
        'last_customer_message_at',
        'last_interaction_at',
        'unread_count',
    ];

    protected $casts = [
        'is_ai_active' => 'boolean',
        'last_customer_message_at' => 'datetime',
        'last_interaction_at' => 'datetime',
        'unread_count' => 'integer',
    ];

    /**
     * Check if the 24-hour service window is active.
     */
    public function isWindowActive(): bool
    {
        if (!$this->last_customer_message_at) {
            return false;
        }
        return $this->last_customer_message_at->diffInHours(now()) <= 24;
    }

    /**
     * Get the contact that owns this conversation.
     */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    /**
     * Get the user assigned to this conversation.
     */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    /**
     * Get all messages in this conversation.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('created_at', 'asc');
    }

    /**
     * Get the latest message in this conversation.
     */
    public function latestMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    /**
     * Scope for open conversations.
     */
    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }
}
