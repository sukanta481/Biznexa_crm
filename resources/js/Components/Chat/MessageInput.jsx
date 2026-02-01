import React, { useState } from 'react';

/**
 * Message Input Component
 * 
 * Features:
 * - Auto-growing textarea
 * - Send button with loading state
 * - Emoji picker trigger
 * - Attachment options
 */
const MessageInput = ({
    value,
    onChange,
    onSend,
    onKeyPress,
    isSending,
    disabled
}) => {
    const [showAttachMenu, setShowAttachMenu] = useState(false);

    return (
        <div className="bg-white border-t border-gray-200 px-4 py-3">
            <div className="flex items-end space-x-3">
                {/* Attachment Button */}
                <div className="relative">
                    <button
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                        disabled={disabled}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    </button>

                    {/* Attachment Menu */}
                    {showAttachMenu && (
                        <div className="absolute bottom-12 left-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 w-48">
                            <AttachmentOption
                                icon="📷"
                                label="Photo"
                                onClick={() => setShowAttachMenu(false)}
                            />
                            <AttachmentOption
                                icon="📄"
                                label="Document"
                                onClick={() => setShowAttachMenu(false)}
                            />
                            <AttachmentOption
                                icon="📍"
                                label="Location"
                                onClick={() => setShowAttachMenu(false)}
                            />
                        </div>
                    )}
                </div>

                {/* Text Input */}
                <div className="flex-1 relative">
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyPress={onKeyPress}
                        placeholder="Type a message..."
                        disabled={disabled || isSending}
                        rows={1}
                        className="w-full px-4 py-3 bg-gray-100 border-0 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all disabled:opacity-50"
                        style={{
                            maxHeight: '150px',
                            minHeight: '48px',
                        }}
                        onInput={(e) => {
                            // Auto-grow textarea
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                        }}
                    />
                </div>

                {/* Emoji Button */}
                <button
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    disabled={disabled}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>

                {/* Send Button */}
                <button
                    onClick={onSend}
                    disabled={disabled || isSending || !value?.trim()}
                    className={`
                        p-3 rounded-full transition-all
                        ${value?.trim() && !isSending
                            ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }
                    `}
                >
                    {isSending ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Typing indicator area */}
            <div className="h-5 mt-1">
                {/* Can show "AI is typing..." here */}
            </div>
        </div>
    );
};

/**
 * Attachment Option Item
 */
const AttachmentOption = ({ icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
    >
        <span className="mr-3">{icon}</span>
        {label}
    </button>
);

export default MessageInput;
