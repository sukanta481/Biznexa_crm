import { useState, useEffect, useRef } from 'react';

/**
 * ChatInterface Component
 * 
 * A complete chat interface for CRM conversations with:
 * - Conversation sidebar with unread counts and staff avatars
 * - Message display with green (outbound) and white (inbound) bubbles
 * - Message input with send button
 * - Header with contact name and AI toggle
 * 
 * @param {Object} props
 * @param {Function} props.useChat - Custom hook that returns { conversations, messages, activeConversation, sendMessage, selectConversation, toggleAI }
 */
export default function ChatInterface({ useChat }) {
    const {
        conversations = [],
        messages = [],
        activeConversation = null,
        sendMessage,
        selectConversation,
        toggleAI,
        loading = false,
    } = useChat();

    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle send message
    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation || sending) return;

        setSending(true);
        try {
            await sendMessage(activeConversation.id, newMessage.trim());
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    // Handle AI toggle
    const handleToggleAI = () => {
        if (activeConversation && toggleAI) {
            toggleAI(activeConversation.id, !activeConversation.is_ai_active);
        }
    };

    return (
        <div className="flex h-full bg-gray-100 rounded-xl overflow-hidden shadow-lg border border-gray-200">
            {/* ==================== SIDEBAR ==================== */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
                {/* Sidebar Header */}
                <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
                    <p className="text-sm text-gray-500">{conversations.length} chats</p>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                    {conversations.length > 0 ? (
                        conversations.map((conversation) => (
                            <ConversationItem
                                key={conversation.id}
                                conversation={conversation}
                                isActive={activeConversation?.id === conversation.id}
                                onClick={() => selectConversation(conversation)}
                            />
                        ))
                    ) : (
                        <div className="p-6 text-center text-gray-500">
                            <ChatIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p>No conversations yet</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* ==================== MAIN CHAT AREA ==================== */}
            <main className="flex-1 flex flex-col min-w-0">
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <ChatHeader
                            conversation={activeConversation}
                            onToggleAI={handleToggleAI}
                        />

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <LoadingSpinner />
                                </div>
                            ) : messages.length > 0 ? (
                                <div className="space-y-4">
                                    {messages.map((message) => (
                                        <MessageBubble key={message.id} message={message} />
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <div className="text-center">
                                        <ChatIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                        <p>No messages yet</p>
                                        <p className="text-sm">Start the conversation!</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <MessageInput
                            value={newMessage}
                            onChange={setNewMessage}
                            onSend={handleSend}
                            disabled={sending}
                        />
                    </>
                ) : (
                    /* No Conversation Selected */
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center text-gray-500">
                            <ChatIcon className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                            <p className="text-xl font-medium mb-2">Select a conversation</p>
                            <p className="text-sm">Choose from the list to start chatting</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

/* ==================== CONVERSATION ITEM ==================== */
function ConversationItem({ conversation, isActive, onClick }) {
    const contact = conversation.contact || {};
    const assignedUser = conversation.assigned_user || null;
    const unreadCount = conversation.unread_count || 0;
    const lastMessage = conversation.latest_message?.body || 'No messages';

    return (
        <button
            onClick={onClick}
            className={`w-full px-4 py-3 flex items-start gap-3 transition-all duration-200 text-left border-l-4 ${isActive
                    ? 'bg-indigo-50 border-l-indigo-600'
                    : 'border-l-transparent hover:bg-gray-50'
                }`}
        >
            {/* Contact Avatar */}
            <div className="relative flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                    {contact.name?.charAt(0)?.toUpperCase() || '?'}
                </div>

                {/* Staff Avatar (if assigned) */}
                {assignedUser && (
                    <div
                        className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white"
                        title={`Assigned to ${assignedUser.name}`}
                    >
                        {assignedUser.name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className={`font-medium truncate ${isActive ? 'text-indigo-900' : 'text-gray-900'}`}>
                        {contact.name || 'Unknown Contact'}
                    </span>

                    {/* Unread Badge */}
                    {unreadCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </div>

                <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                    {lastMessage}
                </p>

                {/* Status indicator */}
                <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${conversation.status === 'open' ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                    <span className="text-xs text-gray-400">
                        {conversation.status === 'open' ? 'Open' : 'Closed'}
                    </span>
                </div>
            </div>
        </button>
    );
}

/* ==================== CHAT HEADER ==================== */
function ChatHeader({ conversation, onToggleAI }) {
    const contact = conversation.contact || {};
    const isAIActive = conversation.is_ai_active;

    return (
        <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm">
            {/* Contact Info */}
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                    {contact.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">{contact.name || 'Unknown Contact'}</h3>
                    <p className="text-sm text-gray-500">{contact.whatsapp_id || 'No WhatsApp ID'}</p>
                </div>
            </div>

            {/* AI Toggle Switch */}
            <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600">AI Active</span>
                <button
                    onClick={onToggleAI}
                    className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isAIActive
                            ? 'bg-green-500 focus:ring-green-500'
                            : 'bg-red-400 focus:ring-red-400'
                        }`}
                >
                    <span
                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isAIActive ? 'translate-x-7' : 'translate-x-0'
                            }`}
                    />
                    <span className={`absolute inset-0 flex items-center ${isAIActive ? 'justify-start pl-1.5' : 'justify-end pr-1.5'}`}>
                        {isAIActive ? (
                            <CheckIcon className="w-3 h-3 text-white" />
                        ) : (
                            <XIcon className="w-3 h-3 text-white" />
                        )}
                    </span>
                </button>
            </div>
        </div>
    );
}

/* ==================== MESSAGE BUBBLE ==================== */
function MessageBubble({ message }) {
    const isOutbound = message.direction === 'outbound';

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow-sm ${isOutbound
                        ? 'bg-green-500 text-white rounded-br-md'
                        : 'bg-white text-gray-900 rounded-bl-md border border-gray-100'
                    }`}
            >
                {/* Message Body */}
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {message.body}
                </p>

                {/* Timestamp & Status */}
                <div className={`flex items-center gap-2 mt-1 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-xs ${isOutbound ? 'text-green-100' : 'text-gray-400'}`}>
                        {formatTime(message.created_at)}
                    </span>

                    {/* Delivery Status (outbound only) */}
                    {isOutbound && message.status && (
                        <DeliveryStatus status={message.status} />
                    )}
                </div>
            </div>
        </div>
    );
}

/* ==================== MESSAGE INPUT ==================== */
function MessageInput({ value, onChange, onSend, disabled }) {
    return (
        <form onSubmit={onSend} className="px-6 py-4 bg-white border-t border-gray-200">
            <div className="flex items-center gap-3">
                {/* Attachment Button (placeholder) */}
                <button
                    type="button"
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <AttachmentIcon className="w-5 h-5" />
                </button>

                {/* Text Input */}
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Type a message..."
                        disabled={disabled}
                        className="w-full px-4 py-3 bg-gray-100 rounded-full border-0 focus:ring-2 focus:ring-green-500 focus:bg-white transition-all placeholder-gray-400"
                    />
                </div>

                {/* Emoji Button (placeholder) */}
                <button
                    type="button"
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <EmojiIcon className="w-5 h-5" />
                </button>

                {/* Send Button */}
                <button
                    type="submit"
                    disabled={disabled || !value.trim()}
                    className={`p-3 rounded-full transition-all duration-200 ${disabled || !value.trim()
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-green-500 text-white hover:bg-green-600 shadow-md hover:shadow-lg'
                        }`}
                >
                    {disabled ? (
                        <LoadingSpinner small />
                    ) : (
                        <SendIcon className="w-5 h-5" />
                    )}
                </button>
            </div>
        </form>
    );
}

/* ==================== DELIVERY STATUS ==================== */
function DeliveryStatus({ status }) {
    const icons = {
        sent: <SingleCheckIcon className="w-3 h-3 text-green-200" />,
        delivered: <DoubleCheckIcon className="w-3 h-3 text-green-200" />,
        read: <DoubleCheckIcon className="w-3 h-3 text-blue-300" />,
        failed: <XIcon className="w-3 h-3 text-red-300" />,
    };

    return icons[status] || null;
}

/* ==================== LOADING SPINNER ==================== */
function LoadingSpinner({ small }) {
    const size = small ? 'w-4 h-4' : 'w-8 h-8';

    return (
        <svg className={`${size} animate-spin`} fill="none" viewBox="0 0 24 24">
            <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
}

/* ==================== ICONS ==================== */
function ChatIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
    );
}

function SendIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
    );
}

function AttachmentIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
    );
}

function EmojiIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function CheckIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
    );
}

function XIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function SingleCheckIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 16 16" fill="currentColor">
            <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
        </svg>
    );
}

function DoubleCheckIcon({ className }) {
    return (
        <svg className={className} viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.78 4.22a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 01-1.06 0L4.22 8.28a.75.75 0 011.06-1.06l1.19 1.19 4.72-4.72a.75.75 0 011.06 0z" />
            <path d="M8.78 4.22a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 01-1.06 0L.22 8.28a.75.75 0 011.06-1.06l1.19 1.19 4.72-4.72a.75.75 0 011.06 0z" />
        </svg>
    );
}
