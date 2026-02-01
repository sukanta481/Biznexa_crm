import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

// Stats Card Component
function StatCard({ title, value, subValue, icon, color }) {
    const colorClasses = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        purple: 'bg-purple-500',
        indigo: 'bg-indigo-500',
        pink: 'bg-pink-500',
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    {subValue && (
                        <p className="text-xs text-gray-400 mt-1">{subValue}</p>
                    )}
                </div>
                <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center text-white`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

// Recent Item Card
function RecentCard({ title, children, viewAllHref, viewAllLabel }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">{title}</h3>
                {viewAllHref && (
                    <Link
                        href={viewAllHref}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        {viewAllLabel || 'View All'}
                    </Link>
                )}
            </div>
            <div className="divide-y divide-gray-100">
                {children}
            </div>
        </div>
    );
}

// Status Badge
function StatusBadge({ status }) {
    const styles = {
        new: 'bg-blue-100 text-blue-800',
        lead: 'bg-yellow-100 text-yellow-800',
        customer: 'bg-green-100 text-green-800',
        open: 'bg-green-100 text-green-800',
        closed: 'bg-gray-100 text-gray-800',
        pending: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-blue-100 text-blue-800',
        processing: 'bg-purple-100 text-purple-800',
        shipped: 'bg-indigo-100 text-indigo-800',
        delivered: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
        </span>
    );
}

export default function Dashboard({ auth, stats, recentContacts, recentOrders, openConversations }) {
    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    // Format date
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <AuthenticatedLayout
            auth={auth}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="Total Contacts"
                            value={stats?.total_contacts || 0}
                            subValue={`${stats?.new_contacts || 0} new, ${stats?.leads || 0} leads, ${stats?.customers || 0} customers`}
                            color="blue"
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            }
                        />
                        <StatCard
                            title="Open Conversations"
                            value={stats?.open_conversations || 0}
                            subValue={`${stats?.total_messages || 0} total messages`}
                            color="green"
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            }
                        />
                        <StatCard
                            title="Products"
                            value={stats?.active_products || 0}
                            subValue={`${stats?.total_products || 0} total products`}
                            color="purple"
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            }
                        />
                        <StatCard
                            title="Revenue"
                            value={formatCurrency(stats?.total_revenue)}
                            subValue={`${stats?.pending_orders || 0} pending orders`}
                            color="indigo"
                            icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        />
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={route('contacts.create')}
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Contact
                            </Link>
                            <Link
                                href={route('chat.index')}
                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Open Chat
                            </Link>
                            <Link
                                href={route('products.index')}
                                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                Manage Products
                            </Link>
                            <Link
                                href={route('orders.index')}
                                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                View Orders
                            </Link>
                        </div>
                    </div>

                    {/* Recent Data Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Recent Contacts */}
                        <RecentCard title="Recent Contacts" viewAllHref={route('contacts.index')} viewAllLabel="View All Contacts">
                            {recentContacts && recentContacts.length > 0 ? (
                                recentContacts.map((contact) => (
                                    <Link
                                        key={contact.id}
                                        href={route('contacts.show', contact.id)}
                                        className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                    <span className="text-indigo-600 font-semibold text-sm">
                                                        {contact.name?.charAt(0)?.toUpperCase() || '?'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                                                    <p className="text-xs text-gray-500">{contact.whatsapp_id}</p>
                                                </div>
                                            </div>
                                            <StatusBadge status={contact.status} />
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="px-6 py-8 text-center text-gray-500">
                                    <p>No contacts yet</p>
                                    <Link href={route('contacts.create')} className="text-indigo-600 hover:underline text-sm">
                                        Add your first contact
                                    </Link>
                                </div>
                            )}
                        </RecentCard>

                        {/* Recent Orders */}
                        <RecentCard title="Recent Orders" viewAllHref={route('orders.index')} viewAllLabel="View All Orders">
                            {recentOrders && recentOrders.length > 0 ? (
                                recentOrders.map((order) => (
                                    <Link
                                        key={order.id}
                                        href={route('orders.show', order.id)}
                                        className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    Order #{order.id}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {order.contact?.name} • {formatDate(order.created_at)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {formatCurrency(order.total_amount)}
                                                </p>
                                                <StatusBadge status={order.status} />
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="px-6 py-8 text-center text-gray-500">
                                    <p>No orders yet</p>
                                </div>
                            )}
                        </RecentCard>
                    </div>

                    {/* Open Conversations */}
                    {openConversations && openConversations.length > 0 && (
                        <div className="mt-8">
                            <RecentCard title="Open Conversations" viewAllHref={route('chat.index')} viewAllLabel="Go to Chat">
                                {openConversations.map((conversation) => (
                                    <Link
                                        key={conversation.id}
                                        href={`${route('chat.index')}?conversation=${conversation.id}`}
                                        className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                    <span className="text-green-600 font-semibold text-sm">
                                                        {conversation.contact?.name?.charAt(0)?.toUpperCase() || '?'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {conversation.contact?.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate max-w-xs">
                                                        {conversation.latest_message?.body || 'No messages'}
                                                    </p>
                                                </div>
                                            </div>
                                            <StatusBadge status={conversation.status} />
                                        </div>
                                    </Link>
                                ))}
                            </RecentCard>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
