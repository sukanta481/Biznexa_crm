<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Enhances conversations table with 24-hour window tracking and unread count.
     */
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            // Last message from customer - for 24-hour service window calculation
            $table->timestamp('last_customer_message_at')->nullable()->after('status');
            
            // General last interaction timestamp
            $table->timestamp('last_interaction_at')->nullable()->after('last_customer_message_at');
            
            // Unread message counter for UI badges
            $table->unsignedInteger('unread_count')->default(0)->after('last_interaction_at');

            // Index for sorting by last interaction
            $table->index('last_interaction_at');
            $table->index('last_customer_message_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropIndex(['last_interaction_at']);
            $table->dropIndex(['last_customer_message_at']);
            $table->dropColumn(['last_customer_message_at', 'last_interaction_at', 'unread_count']);
        });
    }
};
