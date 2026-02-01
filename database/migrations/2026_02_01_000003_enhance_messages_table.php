<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Enhances messages table with wam_id (unique), media support, and location.
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            // WhatsApp Message ID - unique for idempotency
            $table->string('wam_id')->nullable()->unique()->after('id');
            
            // Media support
            $table->string('media_id')->nullable()->after('body');
            $table->string('media_url')->nullable()->after('media_id');
            $table->string('media_mime_type')->nullable()->after('media_url');
            $table->string('media_filename')->nullable()->after('media_mime_type');
            
            // Location support
            $table->decimal('latitude', 10, 7)->nullable()->after('media_filename');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->string('location_name')->nullable()->after('longitude');
            $table->string('location_address')->nullable()->after('location_name');
            
            // Caption for media messages
            $table->text('caption')->nullable()->after('body');
        });

        // Update the type enum to include more message types
        // Note: MySQL requires recreating the column or using raw SQL
        DB::statement("ALTER TABLE messages MODIFY COLUMN type ENUM('text', 'image', 'document', 'audio', 'video', 'location', 'sticker', 'contacts', 'template', 'interactive', 'reaction') DEFAULT 'text'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn([
                'wam_id',
                'media_id',
                'media_url',
                'media_mime_type',
                'media_filename',
                'latitude',
                'longitude',
                'location_name',
                'location_address',
                'caption',
            ]);
        });

        // Revert type enum
        DB::statement("ALTER TABLE messages MODIFY COLUMN type ENUM('text', 'image', 'template') DEFAULT 'text'");
    }
};
