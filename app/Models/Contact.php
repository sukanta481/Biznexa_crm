<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contact extends Model
{
    use HasFactory;

    protected $fillable = [
        'whatsapp_id',
        'name',
        'phone_number',
        'profile_name',
        'profile_picture_url',
        'status',
        'last_active_at',
    ];

    protected $casts = [
        'last_active_at' => 'datetime',
    ];

    /**
     * Get all conversations for this contact.
     */
    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    /**
     * Get all orders for this contact.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Get the latest conversation for this contact.
     */
    public function latestConversation()
    {
        return $this->hasOne(Conversation::class)->latestOfMany();
    }
}
