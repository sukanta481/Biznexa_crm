<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Enhances contacts table with additional WhatsApp profile data.
     */
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->string('phone_number')->nullable()->after('whatsapp_id');
            $table->string('profile_name')->nullable()->after('name');
            $table->string('profile_picture_url')->nullable()->after('profile_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropColumn(['phone_number', 'profile_name', 'profile_picture_url']);
        });
    }
};
