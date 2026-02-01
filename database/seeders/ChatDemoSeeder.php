<?php

namespace Database\Seeders;

use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Database\Seeder;

class ChatDemoSeeder extends Seeder
{
    /**
     * Seed demo data for the chat module.
     */
    public function run(): void
    {
        // Create contacts
        $contact1 = Contact::create([
            'whatsapp_id' => '919876543210',
            'name' => 'Rajesh Kumar',
            'phone_number' => '+919876543210',
            'status' => 'customer',
            'last_active_at' => now(),
        ]);

        $contact2 = Contact::create([
            'whatsapp_id' => '919876543211',
            'name' => 'Priya Sharma',
            'phone_number' => '+919876543211',
            'status' => 'lead',
            'last_active_at' => now()->subHours(26),
        ]);

        $contact3 = Contact::create([
            'whatsapp_id' => '919876543212',
            'name' => 'Amit Patel',
            'phone_number' => '+919876543212',
            'status' => 'new',
            'last_active_at' => now()->subMinutes(10),
        ]);

        // Conversation 1 - Active (recent customer message, with unread)
        $conv1 = Conversation::create([
            'contact_id' => $contact1->id,
            'is_ai_active' => true,
            'status' => 'open',
            'last_customer_message_at' => now(),
            'last_interaction_at' => now(),
            'unread_count' => 2,
        ]);

        Message::create([
            'conversation_id' => $conv1->id,
            'type' => 'text',
            'direction' => 'inbound',
            'body' => 'Hi, I want to inquire about your services',
            'status' => 'read',
            'wam_id' => 'wam_1001',
            'created_at' => now()->subHours(1),
        ]);

        Message::create([
            'conversation_id' => $conv1->id,
            'type' => 'text',
            'direction' => 'outbound',
            'body' => 'Hello! Thank you for reaching out. How can I help you today?',
            'status' => 'read',
            'wam_id' => 'wam_1002',
            'created_at' => now()->subMinutes(55),
        ]);

        Message::create([
            'conversation_id' => $conv1->id,
            'type' => 'text',
            'direction' => 'inbound',
            'body' => 'I need a quote for web development',
            'status' => 'delivered',
            'wam_id' => 'wam_1003',
            'created_at' => now()->subMinutes(30),
        ]);

        Message::create([
            'conversation_id' => $conv1->id,
            'type' => 'text',
            'direction' => 'inbound',
            'body' => 'Can you help with e-commerce as well?',
            'status' => 'delivered',
            'wam_id' => 'wam_1004',
            'created_at' => now()->subMinutes(5),
        ]);

        // Conversation 2 - 24-hour window EXPIRED
        $conv2 = Conversation::create([
            'contact_id' => $contact2->id,
            'is_ai_active' => false,
            'status' => 'open',
            'last_customer_message_at' => now()->subHours(26), // Expired!
            'last_interaction_at' => now()->subHours(25),
            'unread_count' => 0,
        ]);

        Message::create([
            'conversation_id' => $conv2->id,
            'type' => 'text',
            'direction' => 'inbound',
            'body' => 'Hello, I am interested in your products',
            'status' => 'read',
            'wam_id' => 'wam_2001',
            'created_at' => now()->subHours(26),
        ]);

        Message::create([
            'conversation_id' => $conv2->id,
            'type' => 'text',
            'direction' => 'outbound',
            'body' => 'Hi Priya! We have great products. What are you looking for?',
            'status' => 'delivered',
            'wam_id' => 'wam_2002',
            'created_at' => now()->subHours(25),
        ]);

        // Conversation 3 - Recent with different statuses
        $conv3 = Conversation::create([
            'contact_id' => $contact3->id,
            'is_ai_active' => true,
            'status' => 'open',
            'last_customer_message_at' => now()->subMinutes(10),
            'last_interaction_at' => now()->subMinutes(2),
            'unread_count' => 0,
        ]);

        Message::create([
            'conversation_id' => $conv3->id,
            'type' => 'text',
            'direction' => 'inbound',
            'body' => 'Good morning! Is this Biznexa?',
            'status' => 'read',
            'wam_id' => 'wam_3001',
            'created_at' => now()->subMinutes(10),
        ]);

        Message::create([
            'conversation_id' => $conv3->id,
            'type' => 'text',
            'direction' => 'outbound',
            'body' => 'Yes, this is Biznexa CRM. How may I assist you?',
            'status' => 'sent', // Shows 1 grey tick
            'wam_id' => 'wam_3002',
            'created_at' => now()->subMinutes(8),
        ]);

        Message::create([
            'conversation_id' => $conv3->id,
            'type' => 'text',
            'direction' => 'outbound',
            'body' => 'We offer CRM solutions with WhatsApp integration.',
            'status' => 'delivered', // Shows 2 grey ticks
            'wam_id' => 'wam_3003',
            'created_at' => now()->subMinutes(5),
        ]);

        Message::create([
            'conversation_id' => $conv3->id,
            'type' => 'text',
            'direction' => 'outbound',
            'body' => 'Would you like to schedule a demo?',
            'status' => 'pending', // Shows clock icon
            'wam_id' => 'wam_3004',
            'created_at' => now()->subMinutes(2),
        ]);

        $this->command->info('Created 3 contacts, 3 conversations, and demo messages');
    }
}
