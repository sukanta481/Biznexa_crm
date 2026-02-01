<?php

use App\Http\Controllers\ContactController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingsController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Authenticated routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Contacts
    Route::resource('contacts', ContactController::class);

    // Chat / Conversations
    Route::get('/chat', [ConversationController::class, 'index'])->name('chat.index');
    Route::get('/conversations', [ConversationController::class, 'list'])->name('conversations.list');
    Route::get('/conversations/{conversation}/messages', [ConversationController::class, 'messages'])->name('conversations.messages');
    Route::post('/conversations/{conversation}/send', [ConversationController::class, 'sendMessage'])->name('conversations.send');
    Route::post('/conversations/{conversation}/close', [ConversationController::class, 'close'])->name('conversations.close');
    Route::post('/conversations/{conversation}/reopen', [ConversationController::class, 'reopen'])->name('conversations.reopen');
    Route::post('/conversations/{conversation}/assign', [ConversationController::class, 'assignChat'])->name('conversations.assign');
    Route::post('/conversations/{conversation}/read', [ConversationController::class, 'markAsRead'])->name('conversations.read');
    Route::post('/conversations/{conversation}/toggle-ai', [ConversationController::class, 'toggleAI'])->name('conversations.toggle-ai');

    // Products
    Route::resource('products', ProductController::class)->except(['create', 'show', 'edit']);

    // Orders
    Route::resource('orders', OrderController::class)->except(['create', 'edit']);
    Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.status');

    // Settings
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::post('/settings/whatsapp', [SettingsController::class, 'updateWhatsApp'])->name('settings.whatsapp.update');
});

// Profile routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

