import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
    title: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
    icon?: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    defaultOpen = true,
    children,
    icon,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        {title}
                    </span>
                </div>
                {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
            </button>

            {isOpen && (
                <div className="p-4 pt-0 space-y-3">
                    {children}
                </div>
            )}
        </div>
    );
};
