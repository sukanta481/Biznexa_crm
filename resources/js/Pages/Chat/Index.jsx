import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import useChat from '@/hooks/useChat';

export default function ChatIndex({ auth }) {
    const {
        conversations,
        activeConversation,
        messages,
        isLoading,
        sendMessage,
        setActiveConversationId,
        toggleAI,
        assignToMe,
    } = useChat();

    const [assigning, setAssigning] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showContactInfo, setShowContactInfo] = useState(false);
    const [showMobileChat, setShowMobileChat] = useState(false); // Mobile: show chat or list
    const [showNewChatModal, setShowNewChatModal] = useState(false);

    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // Handle conversation selection (for mobile)
    const handleSelectConversation = (id) => {
        setActiveConversationId(id);
        setShowMobileChat(true); // On mobile, show chat after selecting
    };

    // Handle back button (mobile only)
    const handleBackToList = () => {
        setShowMobileChat(false);
    };

    // Check if 24-hour service window is expired
    const isWindowExpired = () => {
        if (!activeConversation?.last_customer_message_at) {
            return true; // No customer message yet, need template
        }
        const lastMessage = new Date(activeConversation.last_customer_message_at);
        const hoursDiff = (Date.now() - lastMessage.getTime()) / (1000 * 60 * 60);
        return hoursDiff > 24;
    };

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle send message
    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            await sendMessage(newMessage.trim());
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send:', error);
        } finally {
            setSending(false);
        }
    };

    // Handle AI toggle
    const handleToggleAI = () => {
        if (activeConversation) {
            toggleAI(activeConversation.id);
        }
    };

    // Handle Take Over (assign to me)
    const handleTakeOver = async () => {
        if (!activeConversation || assigning) return;

        setAssigning(true);
        try {
            await assignToMe(activeConversation.id);
        } catch (error) {
            console.error('Failed to assign:', error);
        } finally {
            setAssigning(false);
        }
    };

    return (
        <AuthenticatedLayout auth={auth} header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Chat</h2>}>
            <Head title="Chat" />

            <div className="py-0 md:py-4">
                <div className="max-w-7xl mx-auto px-0 md:px-4 lg:px-8">
                    <div className="bg-white md:rounded-xl shadow-lg border-0 md:border border-gray-200 overflow-hidden h-[calc(100vh-64px)] md:h-[calc(100vh-180px)]">
                        <div className="flex h-full relative">

                            {/* ==================== SIDEBAR ==================== */}
                            {/* On mobile: hide when chat is active, full width when visible */}
                            {/* On desktop: always visible, fixed width */}
                            <aside className={`
                                ${showMobileChat ? 'hidden' : 'flex'} 
                                md:flex 
                                w-full md:w-80 
                                bg-white border-r border-gray-200 flex-col
                                absolute md:relative inset-0 z-10
                            `}>
                                {/* Sidebar Header */}
                                <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                    <div className="flex items-center justify-between mb-1">
                                        <h2 className="text-lg font-bold text-gray-900">Conversations</h2>
                                        <button
                                            onClick={() => setShowNewChatModal(true)}
                                            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-md"
                                            title="New Chat"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500">{conversations.length} total</p>
                                </div>

                                {/* Conversations List */}
                                <div className="flex-1 overflow-y-auto">
                                    {conversations.length > 0 ? (
                                        conversations.map((conversation) => (
                                            <ConversationItem
                                                key={conversation.id}
                                                conversation={conversation}
                                                isActive={activeConversation?.id === conversation.id}
                                                onClick={() => handleSelectConversation(conversation.id)}
                                            />
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-gray-500">
                                            <ChatIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                            <p className="font-medium">No conversations yet</p>
                                            <p className="text-sm mt-1">Conversations appear when contacts message you via WhatsApp</p>
                                        </div>
                                    )}
                                </div>
                            </aside>

                            {/* ==================== MAIN CHAT AREA ==================== */}
                            {/* On mobile: hide when showing list, full width when chat active */}
                            {/* On desktop: always visible */}
                            <main className={`
                                ${showMobileChat ? 'flex' : 'hidden'} 
                                md:flex 
                                flex-1 flex-col min-w-0
                                absolute md:relative inset-0 z-20 md:z-auto
                                bg-[#ECE5DD]
                            `}>
                                {activeConversation ? (
                                    <>
                                        {/* Chat Header with Back Button on Mobile */}
                                        <ChatHeader
                                            conversation={activeConversation}
                                            currentUserId={auth.user.id}
                                            onToggleAI={handleToggleAI}
                                            onTakeOver={handleTakeOver}
                                            assigning={assigning}
                                            onBack={handleBackToList}
                                            showBackButton={showMobileChat}
                                            onContactInfo={() => setShowContactInfo(true)}
                                        />

                                        {/* Messages Area */}
                                        <div className="flex-1 overflow-y-auto p-6">
                                            {isLoading ? (
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
                                                        <p className="font-medium">No messages yet</p>
                                                        <p className="text-sm">Start the conversation!</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Message Input - with 24-hour lock */}
                                        {isWindowExpired() ? (
                                            <WindowExpiredNotice onSendTemplate={() => setShowTemplateModal(true)} />
                                        ) : (
                                            <MessageInput
                                                value={newMessage}
                                                onChange={setNewMessage}
                                                onSend={handleSend}
                                                disabled={sending}
                                            />
                                        )}
                                    </>
                                ) : (
                                    /* No Conversation Selected */
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="text-center text-gray-500">
                                            <ChatIcon className="w-24 h-24 mx-auto text-gray-300 mb-6" />
                                            <p className="text-2xl font-medium mb-2">Select a conversation</p>
                                            <p className="text-sm">Choose from the list on the left to start chatting</p>
                                        </div>
                                    </div>
                                )}
                            </main>
                        </div>
                    </div>
                </div>

                {/* New Chat Modal */}
                {showNewChatModal && (
                    <NewChatModal
                        onClose={() => setShowNewChatModal(false)}
                        onSuccess={(conversationId) => {
                            setShowNewChatModal(false);
                            setActiveConversationId(conversationId);
                            setShowMobileChat(true); // Show chat on mobile
                        }}
                    />
                )}

                {/* Template Modal */}
                {showTemplateModal && activeConversation && (
                    <TemplateModal
                        contact={activeConversation.contact}
                        onClose={() => setShowTemplateModal(false)}
                        onSend={(templateName) => {
                            // Send template message via API
                            console.log('Sending template:', templateName);
                            setShowTemplateModal(false);
                            alert('Template message feature requires WhatsApp Business API setup with approved templates.');
                        }}
                    />
                )}

                {/* Contact Info Modal */}
                {showContactInfo && activeConversation && (
                    <ContactInfoModal
                        contact={activeConversation.contact}
                        conversation={activeConversation}
                        onClose={() => setShowContactInfo(false)}
                    />
                )}
            </div>
        </AuthenticatedLayout>
    );
}

/* ==================== CONVERSATION ITEM ==================== */
function ConversationItem({ conversation, isActive, onClick }) {
    const contact = conversation.contact || {};
    const assignedUser = conversation.assigned_user || conversation.assignedUser || null;
    const unreadCount = conversation.unread_count || 0;
    const lastMessage = conversation.last_message?.body || conversation.latest_message?.body || 'No messages';

    return (
        <button
            onClick={onClick}
            className={`w-full px-4 py-4 flex items-start gap-3 transition-all duration-200 text-left border-l-4 hover:bg-gray-50 ${isActive
                ? 'bg-indigo-50 border-l-indigo-600'
                : 'border-l-transparent'
                }`}
        >
            {/* Contact Avatar */}
            <div className="relative flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {contact.name?.charAt(0)?.toUpperCase() || '?'}
                </div>

                {/* Staff Avatar Badge (if assigned) */}
                {assignedUser && (
                    <div
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm"
                        title={`Assigned to ${assignedUser.name}`}
                    >
                        {assignedUser.name?.charAt(0)?.toUpperCase() || 'S'}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className={`font-semibold truncate ${isActive ? 'text-indigo-900' : 'text-gray-900'}`}>
                        {contact.name || 'Unknown Contact'}
                    </span>

                    {/* Unread Badge */}
                    {unreadCount > 0 && (
                        <span className="ml-2 px-2.5 py-1 bg-green-500 text-white text-xs font-bold rounded-full min-w-[24px] text-center shadow-sm">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </div>

                <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                    {lastMessage}
                </p>

                {/* Status Indicator */}
                <div className="flex items-center gap-2 mt-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${conversation.status === 'open' ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                    <span className="text-xs text-gray-400 capitalize">
                        {conversation.status || 'open'}
                    </span>
                </div>
            </div>
        </button>
    );
}

/* ==================== CHAT HEADER ==================== */
function ChatHeader({ conversation, currentUserId, onToggleAI, onTakeOver, assigning, onBack, showBackButton, onContactInfo }) {
    const [showMenu, setShowMenu] = useState(false);
    const contact = conversation.contact || {};
    const isAIActive = conversation.is_ai_active;
    const assignedUser = conversation.assigned_user || conversation.assignedUser;
    const isAssignedToMe = assignedUser?.id === currentUserId;

    return (
        <div className="px-2 py-2 bg-[#075E54] flex items-center gap-2 shadow-md">
            {/* Back Button - Mobile */}
            <button
                onClick={onBack}
                className="md:hidden p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Back"
            >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {/* Contact Avatar */}
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold text-lg flex-shrink-0">
                {contact.name?.charAt(0)?.toUpperCase() || '?'}
            </div>

            {/* Contact Info - Flex grow to take space */}
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-base truncate">
                    {contact.name || 'Unknown'}
                </h3>
                <p className="text-xs text-green-100 truncate">
                    {assignedUser ? (isAssignedToMe ? 'Assigned to you' : assignedUser.name) : 'online'}
                </p>
            </div>

            {/* Right Actions - Desktop shows inline, mobile shows in menu */}
            <div className="flex items-center gap-1">
                {/* AI Status Indicator */}
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${isAIActive ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'}`}>
                    {isAIActive ? 'AI ON' : 'AI OFF'}
                </div>

                {/* Menu Button */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="6" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="18" r="2" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showMenu && (
                        <>
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowMenu(false)}
                            />

                            {/* Menu */}
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl z-50 py-2 border border-gray-100">
                                {/* Toggle AI */}
                                <button
                                    onClick={() => { onToggleAI(); setShowMenu(false); }}
                                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                >
                                    <span className={`w-3 h-3 rounded-full ${isAIActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span>{isAIActive ? 'Turn OFF AI' : 'Turn ON AI'}</span>
                                </button>

                                {/* Take Over */}
                                {!isAssignedToMe && (
                                    <button
                                        onClick={() => { onTakeOver(); setShowMenu(false); }}
                                        disabled={assigning}
                                        className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                    >
                                        <UserPlusIcon className="w-5 h-5 text-indigo-600" />
                                        <span>{assigning ? 'Assigning...' : 'Take Over Chat'}</span>
                                    </button>
                                )}

                                {/* Contact Info */}
                                <button
                                    onClick={() => { onContactInfo(); setShowMenu(false); }}
                                    className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                >
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>Contact Info</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/* Small loading spinner for button */
function LoadingSpinnerSmall() {
    return (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}

/* User Plus Icon */
function UserPlusIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
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
                className={`max-w-md lg:max-w-lg px-4 py-3 shadow-md ${isOutbound
                    ? 'bg-green-500 text-white rounded-2xl rounded-br-md'
                    : 'bg-white text-gray-900 rounded-2xl rounded-bl-md border border-gray-100'
                    }`}
            >
                {/* Message Body */}
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {message.body}
                </p>

                {/* Timestamp & Status */}
                <div className={`flex items-center gap-2 mt-2 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
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
        <form onSubmit={onSend} className="px-2 py-2 bg-[#F0F0F0] flex items-center gap-2">
            {/* Attachment Button */}
            <button
                type="button"
                className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
                <AttachmentIcon className="w-6 h-6" />
            </button>

            {/* Text Input */}
            <div className="flex-1">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Type a message"
                    disabled={disabled}
                    className="w-full px-4 py-2.5 bg-white rounded-full border-0 focus:ring-0 text-gray-900 placeholder-gray-400 text-sm"
                />
            </div>

            {/* Emoji Button */}
            <button
                type="button"
                className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
                <EmojiIcon className="w-6 h-6" />
            </button>

            {/* Send / Voice Button */}
            <button
                type="submit"
                disabled={disabled}
                className="p-3 bg-[#00A884] rounded-full text-white shadow-md hover:bg-[#008f72] transition-colors"
            >
                {value.trim() ? (
                    <SendIcon className="w-5 h-5" />
                ) : (
                    <MicIcon className="w-5 h-5" />
                )}
            </button>
        </form>
    );
}

/* ==================== DELIVERY STATUS ==================== */
function DeliveryStatus({ status }) {
    const icons = {
        pending: <ClockIcon className="w-3.5 h-3.5 text-green-200" />,
        sent: <SingleCheckIcon className="w-3.5 h-3.5 text-green-200" />,
        delivered: <DoubleCheckIcon className="w-3.5 h-3.5 text-green-200" />,
        read: <DoubleCheckIcon className="w-3.5 h-3.5 text-blue-300" />,
        failed: <XIcon className="w-3.5 h-3.5 text-red-300" />,
    };

    return icons[status] || null;
}

/* ==================== 24-HOUR WINDOW EXPIRED NOTICE ==================== */
function WindowExpiredNotice({ onSendTemplate }) {
    return (
        <div className="px-6 py-5 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-full">
                        <ClockIcon className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-amber-800">24-Hour Window Expired</p>
                        <p className="text-sm text-amber-600">
                            You can only send a pre-approved template message to re-initiate the conversation.
                        </p>
                    </div>
                </div>
                <button
                    onClick={onSendTemplate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                    <TemplateIcon className="w-5 h-5" />
                    <span>Send Template</span>
                </button>
            </div>
        </div>
    );
}

function TemplateIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );
}

/* ==================== LOADING SPINNER ==================== */
function LoadingSpinner({ small }) {
    const size = small ? 'w-5 h-5' : 'w-10 h-10';

    return (
        <svg className={`${size} animate-spin text-green-500`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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

function MicIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
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

function ClockIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

/* ==================== NEW CHAT MODAL ==================== */
function NewChatModal({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        whatsapp_number: '',
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setIsSubmitting(true);

        try {
            // Validate phone number format (basic)
            const phoneRegex = /^\+?[1-9]\d{1,14}$/;
            if (!phoneRegex.test(formData.whatsapp_number.replace(/\s/g, ''))) {
                setErrors({ whatsapp_number: 'Invalid WhatsApp number format. Use international format (e.g., +91XXXXXXXXXX)' });
                setIsSubmitting(false);
                return;
            }

            console.log('Creating contact...', formData);

            const response = await fetch('/api/contacts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: formData.name,
                    whatsapp_id: formData.whatsapp_number.replace(/\s/g, ''),
                }),
            });

            console.log('Response status:', response.status);

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                setErrors({ general: `Server error (${response.status}): Please check server logs` });
                setIsSubmitting(false);
                return;
            }

            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
                setErrors(data.errors || { general: data.message || 'Failed to create contact' });
                setIsSubmitting(false);
                return;
            }

            // Success - close modal and reload page to show new conversation
            onClose();
            window.location.reload();
        } catch (error) {
            console.error('Contact creation error:', error);
            setErrors({ general: `Error: ${error.message}` });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">New Chat</h3>
                            <p className="text-sm text-green-100">Start a conversation with a contact</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* General Error */}
                    {errors.general && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                            {errors.general}
                        </div>
                    )}

                    {/* Name Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Enter contact name"
                            required
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    {/* WhatsApp Number Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            WhatsApp Number
                        </label>
                        <input
                            type="text"
                            value={formData.whatsapp_number}
                            onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                            placeholder="+919876543210"
                            required
                        />
                        {errors.whatsapp_number && <p className="mt-1 text-sm text-red-600">{errors.whatsapp_number}</p>}
                        <p className="mt-1 text-xs text-gray-500">
                            Use international format with country code (e.g., +91 for India)
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs text-amber-800">
                            <strong>Note:</strong> The first message to this contact must use a WhatsApp-approved template message due to Meta's 24-hour messaging window policy.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${isSubmitting
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                                }`}
                        >
                            {isSubmitting ? 'Creating...' : 'Start Chat'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ==================== TEMPLATE MODAL ==================== */
function TemplateModal({ contact, onClose, onSend }) {
    const templates = [
        { id: 'hello', name: 'Hello Template', description: 'Simple greeting message' },
        { id: 'follow_up', name: 'Follow Up', description: 'Follow up with customer' },
        { id: 'welcome', name: 'Welcome Message', description: 'Welcome new customer' },
        { id: 'order_update', name: 'Order Update', description: 'Update about order status' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <TemplateIcon className="w-6 h-6 text-white" />
                        <h2 className="text-lg font-semibold text-white">Send Template</h2>
                    </div>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Info */}
                <div className="p-4 bg-amber-50 border-b border-amber-100">
                    <p className="text-sm text-amber-700">
                        <strong>Sending to:</strong> {contact?.name || 'Unknown'} ({contact?.whatsapp_id || contact?.phone_number})
                    </p>
                </div>

                {/* Template List */}
                <div className="p-4 max-h-60 overflow-y-auto">
                    <p className="text-sm text-gray-600 mb-3">Select a pre-approved template:</p>
                    <div className="space-y-2">
                        {templates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => onSend(template.id)}
                                className="w-full p-3 text-left border rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-colors"
                            >
                                <p className="font-medium text-gray-800">{template.name}</p>
                                <p className="text-sm text-gray-500">{template.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-500">
                        Templates must be pre-approved by WhatsApp Business API
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ==================== CONTACT INFO MODAL ==================== */
function ContactInfoModal({ contact, conversation, onClose }) {
    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Contact Info</h2>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Avatar and Name */}
                <div className="p-6 flex flex-col items-center border-b border-gray-100">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-3xl mb-3">
                        {contact?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">{contact?.name || 'Unknown'}</h3>
                    <p className="text-sm text-gray-500">{contact?.whatsapp_id || contact?.phone_number || 'No number'}</p>
                </div>

                {/* Contact Details */}
                <div className="p-4 space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide">Phone Number</label>
                        <p className="text-gray-800 font-medium">{contact?.phone_number || contact?.whatsapp_id || 'N/A'}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide">Email</label>
                        <p className="text-gray-800 font-medium">{contact?.email || 'Not provided'}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide">Conversation Status</label>
                        <p className="text-gray-800 font-medium capitalize">{conversation?.status || 'N/A'}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide">AI Status</label>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${conversation?.is_ai_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {conversation?.is_ai_active ? 'AI Active' : 'AI Inactive'}
                        </span>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide">Last Interaction</label>
                        <p className="text-gray-800 font-medium">{formatDate(conversation?.last_interaction_at || conversation?.updated_at)}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide">Created</label>
                        <p className="text-gray-800 font-medium">{formatDate(contact?.created_at)}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
