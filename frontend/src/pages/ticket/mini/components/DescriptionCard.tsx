import React from 'react';
import { FileText } from 'lucide-react';

interface DescriptionCardProps {
    description: string | null;
}

export const DescriptionCard: React.FC<DescriptionCardProps> = ({ description }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Description
                </h3>
            </div>

            <div className="prose prose-sm max-w-none dark:prose-invert overflow-y-auto max-h-96">
                {description ? (
                    <div
                        dangerouslySetInnerHTML={{ __html: description }}
                        className="[&_*]:!text-gray-800 dark:[&_*]:!text-gray-200 text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                    />
                ) : (
                    <span className="text-gray-500 dark:text-gray-400 italic text-sm">
                        No description provided
                    </span>
                )}
            </div>
        </div>
    );
};
