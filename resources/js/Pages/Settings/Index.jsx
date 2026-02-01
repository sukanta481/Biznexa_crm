import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Settings({ auth, whatsappSettings }) {
    const [activeTab, setActiveTab] = useState('whatsapp');

    // Convert settings array to object
    const settingsObj = whatsappSettings.reduce((acc, setting) => {
        acc[setting.key] = setting.value || '';
        return acc;
    }, {});

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        whatsapp_phone_number_id: settingsObj.whatsapp_phone_number_id || '',
        whatsapp_access_token: settingsObj.whatsapp_access_token || '',
        whatsapp_webhook_verify_token: settingsObj.whatsapp_webhook_verify_token || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.whatsapp.update'));
    };

    return (
        <AuthenticatedLayout
            auth={auth}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Settings</h2>}
        >
            <Head title="Settings" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Tabs */}
                    <div className="bg-white rounded-t-lg shadow-sm border-b border-gray-200">
                        <div className="flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('whatsapp')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'whatsapp'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <WhatsAppIcon className="w-5 h-5" />
                                    <span>WhatsApp</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-b-lg shadow-sm p-6">
                        {activeTab === 'whatsapp' && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        WhatsApp Business API Configuration
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-6">
                                        Configure your WhatsApp Business API credentials. Get these from your{' '}
                                        <a
                                            href="https://developers.facebook.com/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-green-600 hover:text-green-700 underline"
                                        >
                                            Meta Developer Dashboard
                                        </a>
                                        .
                                    </p>
                                </div>

                                {/* Phone Number ID */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number ID
                                    </label>
                                    <input
                                        type="text"
                                        value={data.whatsapp_phone_number_id}
                                        onChange={(e) => setData('whatsapp_phone_number_id', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="Enter your WhatsApp Phone Number ID"
                                    />
                                    {errors.whatsapp_phone_number_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.whatsapp_phone_number_id}</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        Found in Meta Business Suite → WhatsApp → API Setup
                                    </p>
                                </div>

                                {/* Access Token */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Access Token
                                    </label>
                                    <textarea
                                        value={data.whatsapp_access_token}
                                        onChange={(e) => setData('whatsapp_access_token', e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                                        placeholder="Enter your WhatsApp Access Token"
                                    />
                                    {errors.whatsapp_access_token && (
                                        <p className="mt-1 text-sm text-red-600">{errors.whatsapp_access_token}</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        Permanent access token from Meta Business Suite
                                    </p>
                                </div>

                                {/* Webhook Verify Token */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Webhook Verify Token
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                value={data.whatsapp_webhook_verify_token}
                                                onChange={(e) => setData('whatsapp_webhook_verify_token', e.target.value)}
                                                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                                                placeholder="Click 'Generate' to create a secure token"
                                                readOnly
                                            />
                                            {/* Copy Button */}
                                            {data.whatsapp_webhook_verify_token && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(data.whatsapp_webhook_verify_token);
                                                        alert('Token copied to clipboard!');
                                                    }}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                                                    title="Copy to clipboard"
                                                >
                                                    <CopyIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        {/* Generate Button */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                // Generate secure random token
                                                const array = new Uint8Array(24);
                                                crypto.getRandomValues(array);
                                                const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
                                                setData('whatsapp_webhook_verify_token', `biznexa_${token}`);
                                            }}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors flex items-center gap-2"
                                        >
                                            <RefreshIcon className="w-4 h-4" />
                                            Generate
                                        </button>
                                    </div>
                                    {errors.whatsapp_webhook_verify_token && (
                                        <p className="mt-1 text-sm text-red-600">{errors.whatsapp_webhook_verify_token}</p>
                                    )}
                                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <p className="text-xs text-amber-800">
                                            <strong>How it works:</strong> Click "Generate" to create a secure token. Save settings, then use this <strong>exact token</strong> when configuring webhooks in Meta Developer Dashboard. The token verifies that incoming webhook requests are from Meta.
                                        </p>
                                    </div>
                                </div>

                                {/* Webhook URL Info */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Webhook URL</h4>
                                    <code className="block bg-white px-3 py-2 rounded border border-blue-300 text-sm text-blue-800 mb-2">
                                        {window.location.origin}/api/whatsapp/webhook
                                    </code>
                                    <p className="text-xs text-blue-700">
                                        Use this URL when configuring webhooks in Meta Business Suite
                                    </p>
                                </div>

                                {/* Success Message */}
                                {recentlySuccessful && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-green-800">
                                            <CheckIcon className="w-5 h-5" />
                                            <span className="font-medium">Settings saved successfully!</span>
                                        </div>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="flex justify-end pt-4 border-t border-gray-200">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${processing
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
                                            }`}
                                    >
                                        {processing ? 'Saving...' : 'Save Settings'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

/* ==================== ICONS ==================== */
function WhatsAppIcon({ className }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
    );
}

function CheckIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    );
}

function CopyIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    );
}

function RefreshIcon({ className }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    );
}
