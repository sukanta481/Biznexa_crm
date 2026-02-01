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
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')
                ->constrained('conversations')
                ->cascadeOnDelete();
            $table->enum('type', ['text', 'image', 'template'])->default('text');
            $table->enum('direction', ['inbound', 'outbound']);
            $table->text('body')->nullable();
            $table->string('meta_id')->nullable()->comment('WhatsApp message ID or template ID');
            $table->enum('status', ['pending', 'sent', 'delivered', 'read', 'failed'])->default('pending');
            $table->timestamps();

            // Performance indexes
            $table->index('created_at');
            $table->index('meta_id');
            $table->index(['conversation_id', 'created_at']);
            $table->index(['direction', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
