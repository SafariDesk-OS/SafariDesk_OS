import React from 'react';
import { Eye, Plus, User } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import MultiSelectAgents from '../../../../components/ui/MultiSelectAgents';
import { AgentType } from '../../../../types/agents';

interface Watcher {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
}

interface WatchersSectionProps {
    watchers: Watcher[];
    agents: AgentType[];
    selectedWatchers: number[];
    setSelectedWatchers: (watchers: number[]) => void;
    onAddWatchers: () => void;
    isSubmitting: boolean;
    userRole?: string;
}

export const WatchersSection: React.FC<WatchersSectionProps> = ({
    watchers,
    agents,
    selectedWatchers,
    setSelectedWatchers,
    onAddWatchers,
    isSubmitting,
    userRole,
}) => {
    const isAdminOrAgent = userRole?.toUpperCase() === 'ADMIN' || userRole?.toUpperCase() === 'AGENT';
    const [showAddWatchers, setShowAddWatchers] = React.useState(false);

    const handleAddWatchers = () => {
        onAddWatchers();
        setShowAddWatchers(false);
    };

    return (
        <CollapsibleSection
            title={`Watchers${watchers.length > 0 ? ` (${watchers.length})` : ''}`}
            icon={<Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
        >
            {/* Watchers List */}
            <div className="space-y-2">
                {watchers && watchers.length > 0 ? (
                    watchers.map((watcher) => (
                        <div
                            key={watcher.id}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                            {watcher.avatar_url ? (
                                <img
                                    src={watcher.avatar_url}
                                    alt={watcher.name}
                                    className="w-6 h-6 rounded-full"
                                />
                            ) : (
                                <div className="w-6 h-6 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                                    <User className="w-3 h-3 text-green-600 dark:text-green-400" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {watcher.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {watcher.email}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                        No watchers assigned
                    </span>
                )}
            </div>

            {/* Add Watchers */}
            {isAdminOrAgent && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    {!showAddWatchers ? (
                        <button
                            onClick={() => setShowAddWatchers(true)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Watchers
                        </button>
                    ) : (
                        <>
                            <MultiSelectAgents
                                label="Select Watchers"
                                agents={agents}
                                selectedAgents={selectedWatchers}
                                onChange={setSelectedWatchers}
                                placeholder="Choose watchers..."
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowAddWatchers(false)}
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddWatchers}
                                    disabled={isSubmitting || selectedWatchers.length === 0}
                                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                    {isSubmitting ? 'Adding...' : 'Add'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </CollapsibleSection>
    );
};
