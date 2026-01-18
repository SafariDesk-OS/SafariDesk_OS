import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Loader, AlertCircle, Check } from 'lucide-react';

export interface InlineSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface InlineSelectFieldProps {
    label: string;
    currentValue: string | null;
    currentDisplayValue: string;
    options: InlineSelectOption[];
    onSave: (newValue: string) => Promise<void>;
    isDisabled?: boolean;
    placeholder?: string;
    emptyText?: string;
    size?: 'sm' | 'md';
    variant?: 'default' | 'badge';
    allowSearch?: boolean;
    icon?: React.ReactNode;
    className?: string;
}

/**
 * InlineSelectField - Chatwoot-style inline editable dropdown
 * 
 * Features:
 * - Click current value to open dropdown
 * - Select new value to auto-save
 * - Loading state during save
 * - Error handling
 * - Keyboard navigation
 * - Search for long lists
 */
export const InlineSelectField: React.FC<InlineSelectFieldProps> = ({
    label,
    currentValue,
    currentDisplayValue,
    options,
    onSave,
    isDisabled = false,
    placeholder = 'Select...',
    emptyText = 'Not set',
    size = 'sm',
    variant = 'default',
    allowSearch = false,
    icon,
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Filter options based on search
    const filteredOptions = allowSearch && searchQuery
        ? options.filter(opt =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : options;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                !buttonRef.current?.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && allowSearch && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen, allowSearch]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setHighlightedIndex(prev =>
                        prev < filteredOptions.length - 1 ? prev + 1 : prev
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredOptions[highlightedIndex] && !filteredOptions[highlightedIndex].disabled) {
                        handleSelect(filteredOptions[highlightedIndex].value);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    setIsOpen(false);
                    setSearchQuery('');
                    break;
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, highlightedIndex, filteredOptions]);

    const handleSelect = async (newValue: string) => {
        if (newValue === currentValue) {
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await onSave(newValue);
            setIsOpen(false);
            setSearchQuery('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update');
            // Keep dropdown open on error
        } finally {
            setIsLoading(false);
        }
    };

    const toggleDropdown = () => {
        if (!isDisabled && !isLoading) {
            setIsOpen(!isOpen);
            setError(null);
            setHighlightedIndex(0);
        }
    };

    const displayValue = currentDisplayValue || emptyText;
    const hasValue = currentValue !== null && currentValue !== '';

    // Size classes
    const sizeClasses = {
        sm: 'text-sm py-2 px-3',
        md: 'text-base py-3 px-4',
    };

    // Variant classes
    const getVariantClasses = () => {
        if (variant === 'badge') {
            // For status/priority - keep colored badge styling
            return 'font-semibold border-2';
        }
        return 'bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600';
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Label */}
            <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                {icon}
                {label}
            </label>

            {/* Current Value Button (Clickable) */}
            <div className="relative">
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={toggleDropdown}
                    disabled={isDisabled || isLoading}
                    className={`
                        w-full rounded-lg transition-all duration-200
                        ${sizeClasses[size]}
                        ${getVariantClasses()}
                        ${isDisabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer'
                        }
                        ${isOpen ? 'ring-2 ring-green-500' : ''}
                        ${error ? 'border-red-500 dark:border-red-500' : ''}
                        flex items-center justify-between
                        text-gray-900 dark:text-gray-100
                    `}
                >
                    <span className={!hasValue ? 'text-gray-500 dark:text-gray-400' : ''}>
                        {displayValue}
                    </span>

                    {isLoading ? (
                        <Loader className="w-4 h-4 animate-spin text-gray-500" />
                    ) : (
                        <ChevronDown
                            className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''
                                }`}
                        />
                    )}
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <div
                        ref={dropdownRef}
                        className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-hidden"
                    >
                        {/* Search Input */}
                        {allowSearch && (
                            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setHighlightedIndex(0);
                                    }}
                                    placeholder="Search..."
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        )}

                        {/* Options List */}
                        <div className="overflow-y-auto max-h-52">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option, index) => {
                                    const isSelected = option.value === currentValue;
                                    const isHighlighted = index === highlightedIndex;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => !option.disabled && handleSelect(option.value)}
                                            disabled={option.disabled}
                                            className={`
                                                w-full px-3 py-2 text-left text-sm transition-colors
                                                flex items-center justify-between
                                                ${option.disabled
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : 'cursor-pointer'
                                                }
                                                ${isSelected
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium'
                                                    : isHighlighted
                                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                }
                                            `}
                                            onMouseEnter={() => setHighlightedIndex(index)}
                                        >
                                            <span>{option.label}</span>
                                            {isSelected && (
                                                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                                            )}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No options found
                                </div>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
                                <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-400">
                                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
