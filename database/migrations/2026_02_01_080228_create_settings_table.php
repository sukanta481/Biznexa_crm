<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string, boolean, integer, json
            $table->string('group')->default('general'); // general, whatsapp, email, etc.
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Insert default WhatsApp settings
        DB::table('settings')->insert([
            [
                'key' => 'whatsapp_phone_number_id',
                'value' => env('WHATSAPP_PHONE_NUMBER_ID', ''),
                'type' => 'string',
                'group' => 'whatsapp',
                'description' => 'WhatsApp Business Phone Number ID from Meta',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'whatsapp_access_token',
                'value' => env('WHATSAPP_ACCESS_TOKEN', ''),
                'type' => 'string',
                'group' => 'whatsapp',
                'description' => 'WhatsApp Business API Access Token',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'whatsapp_webhook_verify_token',
                'value' => env('WHATSAPP_WEBHOOK_VERIFY_TOKEN', ''),
                'type' => 'string',
                'group' => 'whatsapp',
                'description' => 'Webhook Verification Token for Meta webhook setup',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
