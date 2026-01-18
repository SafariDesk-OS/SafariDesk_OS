import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, FileText, LayoutGrid, LayoutList } from 'lucide-react';

interface ViewModeDropdownProps {
    viewMode: 'detailed' | 'card' | 'list';
    onViewChange: (mode: 'detailed' | 'card' | 'list') => void;
}

const viewModeConfig = {
    detailed: { label: 'Detailed View', icon: FileText },
    card: { label: 'Card View', icon: LayoutGrid },
    list: { label: 'List View', icon: LayoutList },
};

export const ViewModeDropdown: React.FC<ViewModeDropdownProps> = ({
    viewMode,
    onViewChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const currentConfig = viewModeConfig[viewMode];
    const CurrentIcon = currentConfig.icon;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <LayoutList className="w-4 h-4" />
                <span className="text-sm font-medium">{currentConfig.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
                    {(Object.keys(viewModeConfig) as Array<keyof typeof viewModeConfig>).map((mode) => {
                        const config = viewModeConfig[mode];
                        if (!config) return null; // Safety check for undefined config
                        const Icon = config.icon;
                        const isSelected = viewMode === mode;

                        return (
                            <button
                                key={mode}
                                onClick={() => {
                                    onViewChange(mode);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${isSelected
                                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{config.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
