<?php

use App\Http\Controllers\Api\WhatsAppWebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| WhatsApp Webhook Routes
|--------------------------------------------------------------------------
|
| These routes handle incoming webhooks from the Meta WhatsApp Cloud API.
| They are excluded from CSRF protection in bootstrap/app.php or
| app/Http/Middleware/VerifyCsrfToken.php
|
*/

Route::prefix('whatsapp')->group(function () {
    // Meta webhook verification (GET)
    Route::get('/webhook', [WhatsAppWebhookController::class, 'verify'])
        ->name('whatsapp.webhook.verify');

    // Incoming message webhook (POST)
    Route::post('/webhook', [WhatsAppWebhookController::class, 'receive'])
        ->name('whatsapp.webhook.receive');
});
