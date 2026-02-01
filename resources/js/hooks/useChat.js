import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Custom Hook: useChat
 * 
 * Manages chat state including:
 * - Conversations list
 * - Active conversation selection
 * - Messages for active conversation
 * - Real-time updates via Echo (Pusher/Reverb)
 * - Sending messages
 * - Toggle AI active state
 */
const useChat = () => {
    // State
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Get active conversation object
    const activeConversation = conversations.find(c => c.id === activeConversationId);

    /**
     * Fetch all conversations
     */
    const fetchConversations = useCallback(async () => {
        try {
            const response = await axios.get('/conversations');
            setConversations(response.data || []);
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
            setError('Failed to load conversations');
        }
    }, []);

    /**
     * Fetch messages for a conversation
     */
    const fetchMessages = useCallback(async (conversationId) => {
        if (!conversationId) return;

        setIsLoading(true);
        try {
            const response = await axios.get(`/conversations/${conversationId}/messages`);
            setMessages(response.data.data || response.data);
        } catch (err) {
            console.error('Failed to fetch messages:', err);
            setError('Failed to load messages');
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Set active conversation and fetch its messages
     */
    const setActiveConversation = useCallback((conversationId) => {
        setActiveConversationId(conversationId);
        fetchMessages(conversationId);

        // Mark conversation as read
        if (conversationId) {
            axios.post(`/conversations/${conversationId}/read`).catch(console.error);

            // Update local unread count
            setConversations(prev => prev.map(c =>
                c.id === conversationId ? { ...c, unread_count: 0 } : c
            ));
        }
    }, [fetchMessages]);

    /**
     * Send a message
     */
    const sendMessage = useCallback(async (body) => {
        if (!activeConversationId || !body.trim()) return;

        // Optimistic update - add message immediately
        const tempMessage = {
            id: `temp-${Date.now()}`,
            conversation_id: activeConversationId,
            direction: 'outbound',
            type: 'text',
            body: body.trim(),
            status: 'pending',
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, tempMessage]);

        try {
            const response = await axios.post(`/conversations/${activeConversationId}/send`, {
                body: body.trim(),
            });

            // Replace temp message with real one
            setMessages(prev => prev.map(m =>
                m.id === tempMessage.id ? response.data : m
            ));

            // Update conversation's last message
            setConversations(prev => prev.map(c =>
                c.id === activeConversationId
                    ? { ...c, last_message: response.data }
                    : c
            ));

            return response.data;
        } catch (err) {
            console.error('Failed to send message:', err);

            // Mark temp message as failed
            setMessages(prev => prev.map(m =>
                m.id === tempMessage.id ? { ...m, status: 'failed' } : m
            ));

            throw err;
        }
    }, [activeConversationId]);

    /**
     * Toggle AI active state for a conversation
     */
    const toggleAI = useCallback(async (conversationId) => {
        const conversation = conversations.find(c => c.id === conversationId);
        if (!conversation) return;

        const newState = !conversation.is_ai_active;

        // Optimistic update
        setConversations(prev => prev.map(c =>
            c.id === conversationId ? { ...c, is_ai_active: newState } : c
        ));

        try {
            await axios.post(`/conversations/${conversationId}/toggle-ai`);
        } catch (err) {
            console.error('Failed to toggle AI:', err);

            // Revert on error
            setConversations(prev => prev.map(c =>
                c.id === conversationId ? { ...c, is_ai_active: !newState } : c
            ));
        }
    }, [conversations]);

    /**
     * Assign conversation to current user (Take Over)
     */
    const assignToMe = useCallback(async (conversationId) => {
        try {
            const response = await axios.post(`/conversations/${conversationId}/assign`);

            // Update conversation in list
            setConversations(prev => prev.map(c =>
                c.id === conversationId
                    ? { ...c, ...response.data.conversation }
                    : c
            ));

            return response.data;
        } catch (err) {
            console.error('Failed to assign conversation:', err);
            throw err;
        }
    }, []);

    /**
     * Handle new message from real-time subscription
     */
    const handleNewMessage = useCallback((event) => {
        const { message, conversation } = event;

        // Add message if it's for the active conversation
        if (message.conversation_id === activeConversationId) {
            setMessages(prev => {
                // Avoid duplicates
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
            });
        }

        // Update conversation in list
        setConversations(prev => prev.map(c => {
            if (c.id === message.conversation_id) {
                return {
                    ...c,
                    last_message: message,
                    unread_count: message.conversation_id === activeConversationId
                        ? 0
                        : (c.unread_count || 0) + 1,
                };
            }
            return c;
        }));
    }, [activeConversationId]);

    /**
     * Initial load
     */
    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    /**
     * Subscribe to real-time updates (Laravel Echo)
     */
    useEffect(() => {
        // Check if Echo is available
        if (typeof window !== 'undefined' && window.Echo) {
            // Subscribe to inbox channel
            const channel = window.Echo.private('inbox');

            channel.listen('.message.received', handleNewMessage);

            // Cleanup
            return () => {
                channel.stopListening('.message.received');
            };
        }
    }, [handleNewMessage]);

    /**
     * Subscribe to active conversation channel
     */
    useEffect(() => {
        if (!activeConversationId || typeof window === 'undefined' || !window.Echo) return;

        const channel = window.Echo.private(`conversation.${activeConversationId}`);

        channel.listen('.message.received', handleNewMessage);

        return () => {
            channel.stopListening('.message.received');
            window.Echo.leave(`conversation.${activeConversationId}`);
        };
    }, [activeConversationId, handleNewMessage]);

    return {
        // State
        conversations,
        activeConversation,
        messages,
        isLoading,
        error,

        // Actions
        sendMessage,
        setActiveConversationId: setActiveConversation,
        toggleAI,
        assignToMe,
        refreshConversations: fetchConversations,
        refreshMessages: () => fetchMessages(activeConversationId),
    };
};

export default useChat;
