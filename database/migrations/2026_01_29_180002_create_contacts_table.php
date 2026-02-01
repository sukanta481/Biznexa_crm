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
        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->string('whatsapp_id')->unique();
            $table->string('name');
            $table->enum('status', ['new', 'lead', 'customer'])->default('new');
            $table->timestamp('last_active_at')->nullable();
            $table->timestamps();

            // Performance indexes
            $table->index('whatsapp_id');
            $table->index('created_at');
            $table->index('status');
            $table->index('last_active_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contacts');
    }
};
