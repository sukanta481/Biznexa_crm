import React from 'react';

/**
 * Chat Header Component
 * 
 * Shows:
 * - Contact name and avatar
 * - Online status
 * - AI Active toggle switch (green/red)
 * - Assigned user info
 */
const ChatHeader = ({ contact, isAIActive, assignedUser, onToggleAI }) => {
    return (
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
            {/* Left: Contact Info */}
            <div className="flex items-center space-x-4">
                {/* Avatar */}
                <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                            {contact?.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                </div>

                {/* Name & Phone */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        {contact?.name || 'Unknown Contact'}
                    </h2>
                    <p className="text-sm text-gray-500">
                        {formatPhoneNumber(contact?.whatsapp_id)}
                    </p>
                </div>

                {/* Contact Status Badge */}
                <ContactStatusBadge status={contact?.status} />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center space-x-4">
                {/* Assigned User */}
                {assignedUser && (
                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                                {assignedUser.name?.charAt(0)?.toUpperCase()}
                            </span>
                        </div>
                        <span className="text-sm text-blue-700">{assignedUser.name}</span>
                    </div>
                )}

                {/* AI Toggle Switch */}
                <div className="flex items-center space-x-3">
                    <span className={`text-sm font-medium ${isAIActive ? 'text-green-600' : 'text-gray-500'}`}>
                        AI Active
                    </span>
                    <button
                        onClick={onToggleAI}
                        className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
                            ${isAIActive
                                ? 'bg-green-500 focus:ring-green-500'
                                : 'bg-red-400 focus:ring-red-400'
                            }
                        `}
                    >
                        <span
                            className={`
                                inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform
                                ${isAIActive ? 'translate-x-6' : 'translate-x-1'}
                            `}
                        />
                    </button>
                </div>

                {/* More Actions Dropdown */}
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

/**
 * Contact Status Badge
 */
const ContactStatusBadge = ({ status }) => {
    const getStatusConfig = (status) => {
        switch (status) {
            case 'new':
                return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'New' };
            case 'lead':
                return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Lead' };
            case 'customer':
                return { bg: 'bg-green-100', text: 'text-green-700', label: 'Customer' };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-700', label: status || 'Unknown' };
        }
    };

    const config = getStatusConfig(status);

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
};

/**
 * Format phone number for display
 */
const formatPhoneNumber = (phone) => {
    if (!phone) return '';

    // Format: +91 98765 43210
    if (phone.length >= 10) {
        const countryCode = phone.slice(0, -10);
        const part1 = phone.slice(-10, -5);
        const part2 = phone.slice(-5);
        return `+${countryCode} ${part1} ${part2}`;
    }

    return phone;
};

export default ChatHeader;
