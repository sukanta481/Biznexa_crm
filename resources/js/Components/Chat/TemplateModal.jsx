import { useState } from 'react';
import axios from 'axios';

/**
 * Modal for selecting and sending pre-approved WhatsApp templates.
 * Shows when 24-hour service window expires.
 */
export default function TemplateModal({ isOpen, onClose, conversationId, contactPhone, onSuccess }) {
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);

    // Pre-defined templates (in production, fetch from API)
    const templates = [
        {
            id: 'hello_world',
            name: 'Hello World',
            description: 'Simple greeting message',
            language: 'en_US',
            preview: 'Hello! 👋 Thank you for contacting us. How may we assist you today?',
        },
        {
            id: 'order_update',
            name: 'Order Update',
            description: 'Notify customer about order status',
            language: 'en_US',
            preview: 'Hello {{1}}! Your order #{{2}} has been {{3}}. Track your order at {{4}}',
        },
        {
            id: 'appointment_reminder',
            name: 'Appointment Reminder',
            description: 'Remind customer about scheduled appointment',
            language: 'en_US',
            preview: 'Hi {{1}}! This is a reminder for your appointment scheduled on {{2}} at {{3}}.',
        },
        {
            id: 'payment_confirmation',
            name: 'Payment Confirmation',
            description: 'Confirm payment received',
            language: 'en_US',
            preview: 'Thank you {{1}}! We have received your payment of ₹{{2}} for invoice #{{3}}.',
        },
    ];

    const handleSend = async () => {
        if (!selectedTemplate) return;

        setSending(true);
        setError(null);

        try {
            const response = await axios.post(`/api/conversations/${conversationId}/template`, {
                template_name: selectedTemplate.id,
                language_code: selectedTemplate.language,
            });

            onSuccess?.(response.data);
            onClose();
        } catch (err) {
            console.error('Failed to send template:', err);
            setError(err.response?.data?.message || 'Failed to send template. Please try again.');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Send Template Message</h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Select a pre-approved template to re-initiate the conversation
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Template List */}
                    <div className="p-4 max-h-80 overflow-y-auto space-y-3">
                        {templates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => setSelectedTemplate(template)}
                                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${selectedTemplate?.id === template.id
                                        ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900">{template.name}</h4>
                                        <p className="text-sm text-gray-500 mt-0.5">{template.description}</p>
                                    </div>
                                    {selectedTemplate?.id === template.id && (
                                        <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                                    )}
                                </div>
                                <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                                    <p className="text-sm text-gray-600 italic">{template.preview}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={!selectedTemplate || sending}
                            className={`flex items-center gap-2 px-5 py-2 font-semibold rounded-lg transition-all ${!selectedTemplate || sending
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-green-500 text-white hover:bg-green-600 shadow-md hover:shadow-lg'
                                }`}
                        >
                            {sending ? (
                                <>
                                    <LoadingSpinner />
                                    <span>Sending...</span>
                                </>
                            ) : (
                                <>
                                    <SendIcon className="w-4 h-4" />
                                    <span>Send Template</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ==================== ICONS ==================== */
function XIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

function CheckCircleIcon({ className }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
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

function LoadingSpinner() {
    return (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}
