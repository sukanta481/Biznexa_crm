import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

// Status Badge
function StatusBadge({ status }) {
    const styles = {
        new: 'bg-blue-100 text-blue-800',
        lead: 'bg-yellow-100 text-yellow-800',
        customer: 'bg-green-100 text-green-800',
        open: 'bg-green-100 text-green-800',
        closed: 'bg-gray-100 text-gray-800',
        pending: 'bg-yellow-100 text-yellow-800',
        delivered: 'bg-green-100 text-green-800',
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
        </span>
    );
}

export default function ContactsShow({ auth, contact }) {
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    return (
        <AuthenticatedLayout
            auth={auth}
            header={
                <div className="flex items-center gap-4">
                    <Link
                        href={route('contacts.index')}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">Contact Details</h2>
                </div>
            }
        >
            <Head title={`Contact - ${contact.name}`} />

            <div className="py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Contact Info Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                        <div className="flex items-start gap-6">
                            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-indigo-600 font-bold text-2xl">
                                    {contact.name?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-gray-900">{contact.name}</h1>
                                    <StatusBadge status={contact.status} />
                                </div>
                                <p className="text-gray-500 mt-1">
                                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {contact.whatsapp_id}
                                </p>
                                <p className="text-gray-400 text-sm mt-2">
                                    Added on {formatDate(contact.created_at)}
                                </p>
                            </div>
                            <Link
                                href={`${route('chat.index')}?contact=${contact.id}`}
                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Start Chat
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Conversations */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-900">Conversations</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {contact.conversations && contact.conversations.length > 0 ? (
                                    contact.conversations.map((conv) => (
                                        <Link
                                            key={conv.id}
                                            href={`${route('chat.index')}?conversation=${conv.id}`}
                                            className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        Conversation #{conv.id}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1 truncate">
                                                        {conv.latest_message?.body || 'No messages'}
                                                    </p>
                                                </div>
                                                <StatusBadge status={conv.status} />
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="px-6 py-8 text-center text-gray-500">
                                        No conversations yet
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Orders */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-900">Orders</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {contact.orders && contact.orders.length > 0 ? (
                                    contact.orders.map((order) => (
                                        <Link
                                            key={order.id}
                                            href={route('orders.show', order.id)}
                                            className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        Order #{order.id}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {formatDate(order.created_at)}
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
                                        No orders yet
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
