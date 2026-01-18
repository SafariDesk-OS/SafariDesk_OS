import React from 'react';
import { Tag, Plus } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { Input } from '../../../../components/ui/Input';

interface LabelsSectionProps {
    tags: string[];
    newTagInput: string;
    setNewTagInput: (value: string) => void;
    onAddTags: () => void;
    isSubmitting: boolean;
    userRole?: string;
}

export const LabelsSection: React.FC<LabelsSectionProps> = ({
    tags,
    newTagInput,
    setNewTagInput,
    onAddTags,
    isSubmitting,
    userRole,
}) => {
    const isAdminOrAgent = userRole?.toUpperCase() === 'ADMIN' || userRole?.toUpperCase() === 'AGENT';

    return (
        <CollapsibleSection title="Labels" icon={<Tag className="w-4 h-4 text-gray-600 dark:text-gray-400" />}>
            {/* Tags Display */}
            <div className="flex flex-wrap gap-2">
                {tags && tags.length > 0 ? (
                    tags.map((tag) => (
                        <span
                            key={tag}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-700"
                        >
                            {tag}
                        </span>
                    ))
                ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                        No labels assigned
                    </span>
                )}
            </div>

            {/* Add Tags Input */}
            {isAdminOrAgent && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <Input
                        id="add-tags"
                        label="Add Labels (comma separated)"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        placeholder="bug, feature, urgent"
                        size="sm"
                    />
                    <button
                        onClick={onAddTags}
                        disabled={isSubmitting || !newTagInput.trim()}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        {isSubmitting ? 'Adding...' : 'Add Labels'}
                    </button>
                </div>
            )}
        </CollapsibleSection>
    );
};
