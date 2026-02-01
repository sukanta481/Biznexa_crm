<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the CRM dashboard with statistics.
     */
    public function index()
    {
        // Get statistics
        $stats = [
            'total_contacts' => Contact::count(),
            'new_contacts' => Contact::where('status', 'new')->count(),
            'leads' => Contact::where('status', 'lead')->count(),
            'customers' => Contact::where('status', 'customer')->count(),
            'total_conversations' => Conversation::count(),
            'open_conversations' => Conversation::where('status', 'open')->count(),
            'total_messages' => Message::count(),
            'total_products' => Product::count(),
            'active_products' => Product::where('is_active', true)->count(),
            'total_orders' => Order::count(),
            'pending_orders' => Order::where('status', 'pending')->count(),
            'total_revenue' => Order::where('status', 'delivered')->sum('total_amount'),
        ];

        // Get recent contacts
        $recentContacts = Contact::latest()
            ->take(5)
            ->get();

        // Get recent orders
        $recentOrders = Order::with('contact')
            ->latest()
            ->take(5)
            ->get();

        // Get open conversations
        $openConversations = Conversation::with('contact', 'latestMessage')
            ->where('status', 'open')
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'recentContacts' => $recentContacts,
            'recentOrders' => $recentOrders,
            'openConversations' => $openConversations,
        ]);
    }
}
