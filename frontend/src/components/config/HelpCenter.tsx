import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Bot, Save, Sparkles, Brain } from 'lucide-react';
import { APIS } from '../../services/apis';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { useAuthStore } from '../../stores/authStore';

interface ChatbotConfig {
    is_enabled: boolean;
    greeting_message: string;
    tone: string;
    instructions: string;
    agent_signature?: string;
    kb_search_enabled: boolean;
    auto_categorize: boolean;
    auto_route_department: boolean;
    auto_assign_priority: boolean;
    max_response_chars?: number;
}

const TONE_OPTIONS = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'concise', label: 'Concise' },
    { value: 'empathetic', label: 'Empathetic' },
];

export const HelpCenter: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [config, setConfig] = useState<ChatbotConfig>({
        is_enabled: true,
        greeting_message: '',
        tone: 'professional',
        instructions: '',
        agent_signature: '',
        kb_search_enabled: true,
        auto_categorize: true,
        auto_route_department: true,
        auto_assign_priority: true,
        max_response_chars: 300,
    });

    useEffect(() => {
        fetchConfig();
    }, [refreshKey]);

    const fetchConfig = async () => {
        try {
            const { data } = await axios.get(APIS.AI_CONFIG_VIEW, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
            });
            setConfig(data);
        } catch (error) {
            console.error('Failed to fetch AI config', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.put(APIS.AI_CONFIG_VIEW, config, {
                headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
            });
            toast.success('AI Settings updated successfully');
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error('Failed to update AI config', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const Toggle = ({ label, checked, onChange, description }: { label: string, checked: boolean, onChange: (v: boolean) => void, description?: string }) => (
        <div className="flex items-start justify-between py-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</span>
                {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${checked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
                        }`}
                />
            </button>
        </div>
    );

    if (loading) return <div className="p-8 text-center">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-green-500" />
                        AI Help Centre
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your AI assistant's persona and capabilities.</p>
                </div>
                <Button onClick={handleSave} loading={saving} icon={Save}>
                    Save Changes
                </Button>
            </div>

            {/* Enable Switch */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <Toggle
                    label="Enable AI Chatbot"
                    description="Turn the AI assistant on or off for your Help Center widget."
                    checked={config.is_enabled}
                    onChange={(v) => setConfig({ ...config, is_enabled: v })}
                />
            </div>

            {/* Persona Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <Bot className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Persona & Voice</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Greeting Message</label>
                        <Textarea
                            value={config.greeting_message}
                            onChange={(e) => setConfig({ ...config, greeting_message: e.target.value })}
                            placeholder="Hi! How can I help you today?"
                            rows={3}
                            className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">This appears on the Welcome Card before the chat starts.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tone of Voice</label>
                        <select
                            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm py-2.5 px-3"
                            value={config.tone}
                            onChange={(e) => setConfig({ ...config, tone: e.target.value })}
                        >
                            {TONE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Controls how formal or casual the AI sounds.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Maximum Response Length</label>
                        <Input
                            type="number"
                            min={100}
                            max={800}
                            value={config.max_response_chars || 300}
                            onChange={(e) => setConfig({ ...config, max_response_chars: parseInt(e.target.value) || 300 })}
                            placeholder="300"
                        />
                        <p className="text-xs text-gray-500 mt-1">Limits AI response length in characters. Lower = more concise (100-800).</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Agent Signature</label>
                        <Input
                            type="text"
                            maxLength={20}
                            value={config.agent_signature || ''}
                            onChange={(e) => setConfig({ ...config, agent_signature: e.target.value })}
                            placeholder="e.g., ^AG or ~Support Team"
                        />
                        <p className="text-xs text-gray-500 mt-1">Optional initials/signature appended to responses (max 20 chars).</p>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Custom System Instructions</label>
                        <Textarea
                            value={config.instructions}
                            onChange={(e) => setConfig({ ...config, instructions: e.target.value })}
                            placeholder="E.g. You are a support agent for Acme Corp. Never recommend competitor products. Always be polite..."
                            rows={5}
                            className="w-full font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Add specific rules or business context (Internal Note: This is appended to the system prompt).</p>
                    </div>
                </div>
            </div>

            {/* Capabilities Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <Brain className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Smart Capabilities</h3>
                </div>

                <Toggle
                    label="Prioritize Knowledge Base"
                    description="The AI will always search the KB for answers before offering to create a ticket."
                    checked={config.kb_search_enabled}
                    onChange={(v) => setConfig({ ...config, kb_search_enabled: v })}
                />
                <Toggle
                    label="Auto-Categorize Tickets"
                    description="AI analyzes the request to suggest the best Ticket Category."
                    checked={config.auto_categorize}
                    onChange={(v) => setConfig({ ...config, auto_categorize: v })}
                />
                <Toggle
                    label="Auto-Route to Department"
                    description="AI detects the department (Billing, Support, IT) from the context."
                    checked={config.auto_route_department}
                    onChange={(v) => setConfig({ ...config, auto_route_department: v })}
                />
                <Toggle
                    label="Auto-Assign Priority"
                    description="AI estimates urgency based on user sentiment and keywords."
                    checked={config.auto_assign_priority}
                    onChange={(v) => setConfig({ ...config, auto_assign_priority: v })}
                />
            </div>

        </div>
    );
};
