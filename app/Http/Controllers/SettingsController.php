<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    /**
     * Display settings page.
     */
    public function index()
    {
        $whatsappSettings = Setting::where('group', 'whatsapp')->get();

        return Inertia::render('Settings/Index', [
            'whatsappSettings' => $whatsappSettings,
        ]);
    }

    /**
     * Update WhatsApp settings.
     */
    public function updateWhatsApp(Request $request)
    {
        $validated = $request->validate([
            'whatsapp_phone_number_id' => 'nullable|string|max:255',
            'whatsapp_access_token' => 'nullable|string|max:500',
            'whatsapp_webhook_verify_token' => 'nullable|string|max:255',
        ]);

        foreach ($validated as $key => $value) {
            Setting::set($key, $value ?? '', 'string', 'whatsapp');
        }

        return redirect()->back()->with('success', 'WhatsApp settings updated successfully!');
    }
}
