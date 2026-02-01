import React from 'react';

/**
 * Message List Component
 * 
 * Displays chat messages with:
 * - Green bubbles for outbound (right side)
 * - White bubbles for inbound (left side)
 * - Timestamps and status indicators
 */
const MessageList = ({ messages = [], isLoading, messagesEndRef }) => {
    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
        >
            {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
            ) : (
                <>
                    {/* Date separator for first message */}
                    <DateSeparator date={messages[0]?.created_at} />

                    {messages.map((message, index) => (
                        <React.Fragment key={message.id}>
                            {/* Show date separator if day changes */}
                            {index > 0 && isDifferentDay(messages[index - 1]?.created_at, message.created_at) && (
                                <DateSeparator date={message.created_at} />
                            )}
                            <MessageBubble message={message} />
                        </React.Fragment>
                    ))}

                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                </>
            )}
        </div>
    );
};

/**
 * Individual Message Bubble
 */
const MessageBubble = ({ message }) => {
    const isOutbound = message.direction === 'outbound';

    return (
        <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`
                    max-w-[70%] px-4 py-2 rounded-2xl shadow-sm
                    ${isOutbound
                        ? 'bg-green-500 text-white rounded-br-md'
                        : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                    }
                `}
            >
                {/* Message Body */}
                <p className="text-sm whitespace-pre-wrap break-words">
                    {message.body}
                </p>

                {/* Message Footer: Time + Status */}
                <div className={`flex items-center justify-end mt-1 space-x-1 ${isOutbound ? 'text-green-100' : 'text-gray-400'}`}>
                    <span className="text-xs">
                        {formatMessageTime(message.created_at)}
                    </span>

                    {/* Status indicators for outbound messages */}
                    {isOutbound && (
                        <MessageStatus status={message.status} />
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Message Status Indicator (checkmarks)
 */
const MessageStatus = ({ status }) => {
    const getStatusIcon = () => {
        switch (status) {
            case 'pending':
                return (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="2" />
                    </svg>
                );
            case 'sent':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                );
            case 'delivered':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'read':
                return (
                    <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'failed':
                return (
                    <svg className="w-4 h-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return <span>{getStatusIcon()}</span>;
};

/**
 * Date Separator
 */
const DateSeparator = ({ date }) => {
    if (!date) return null;

    return (
        <div className="flex items-center justify-center my-4">
            <span className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-200 rounded-full">
                {formatDateSeparator(date)}
            </span>
        </div>
    );
};

/**
 * Format time for message bubble
 */
const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format date for separator
 */
const formatDateSeparator = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
};

/**
 * Check if two dates are on different days
 */
const isDifferentDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1).toDateString();
    const d2 = new Date(date2).toDateString();
    return d1 !== d2;
};

export default MessageList;
