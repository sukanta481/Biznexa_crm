import React from 'react';

/**
 * Conversation Sidebar Component
 * 
 * Shows list of conversations with:
 * - Contact name and avatar
 * - Last message preview
 * - Unread count badge
 * - Staff avatar if assigned
 * - Active state highlighting
 */
const ConversationSidebar = ({
    conversations = [],
    activeConversationId,
    onSelectConversation
}) => {
    return (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h1 className="text-xl font-bold text-gray-800">Conversations</h1>
                <div className="mt-2 relative">
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                        No conversations yet
                    </div>
                ) : (
                    conversations.map((conversation) => (
                        <ConversationItem
                            key={conversation.id}
                            conversation={conversation}
                            isActive={conversation.id === activeConversationId}
                            onClick={() => onSelectConversation(conversation.id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

/**
 * Individual Conversation Item
 */
const ConversationItem = ({ conversation, isActive, onClick }) => {
    const { contact, last_message, unread_count, assigned_user, is_ai_active } = conversation;

    return (
        <div
            onClick={onClick}
            className={`
                flex items-center p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors
                ${isActive ? 'bg-green-50 border-l-4 border-l-green-500' : ''}
            `}
        >
            {/* Contact Avatar */}
            <div className="relative flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                        {contact?.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                </div>

                {/* Online indicator */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
            </div>

            {/* Conversation Info */}
            <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {contact?.name || 'Unknown'}
                    </h3>
                    <span className="text-xs text-gray-500">
                        {formatTime(last_message?.created_at)}
                    </span>
                </div>

                <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-500 truncate max-w-[180px]">
                        {last_message?.direction === 'outbound' && (
                            <span className="text-green-600">You: </span>
                        )}
                        {last_message?.body || 'No messages yet'}
                    </p>

                    {/* Badges */}
                    <div className="flex items-center space-x-1">
                        {/* Unread Count */}
                        {unread_count > 0 && (
                            <span className="px-2 py-0.5 text-xs font-bold text-white bg-green-500 rounded-full">
                                {unread_count > 99 ? '99+' : unread_count}
                            </span>
                        )}

                        {/* AI Active Indicator */}
                        {is_ai_active && (
                            <span className="px-1.5 py-0.5 text-xs font-medium text-purple-700 bg-purple-100 rounded">
                                AI
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Assigned Staff Avatar */}
            {assigned_user && (
                <div className="ml-2 flex-shrink-0">
                    <div
                        className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                        title={`Assigned to ${assigned_user.name}`}
                    >
                        <span className="text-white text-xs font-medium">
                            {assigned_user.name?.charAt(0)?.toUpperCase()}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Format timestamp for display
 */
const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Less than 24 hours - show time
    if (diff < 86400000) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Less than 7 days - show day name
    if (diff < 604800000) {
        return date.toLocaleDateString([], { weekday: 'short' });
    }

    // Older - show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default ConversationSidebar;
