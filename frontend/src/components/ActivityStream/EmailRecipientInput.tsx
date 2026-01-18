import React, { useState, useRef, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface EmailRecipientInputProps {
    label: string;
    emails: string[];
    onChange: (emails: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
}

/**
 * Minimal email chip input component for To/CC/BCC fields.
 * - Type email and press Enter/Tab/comma to add
 * - Click X to remove
 * - Validates email format
 */
export const EmailRecipientInput: React.FC<EmailRecipientInputProps> = ({
    label,
    emails,
    onChange,
    placeholder = 'Enter email...',
    disabled = false,
}) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const isValidEmail = (email: string): boolean => {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailPattern.test(email.trim());
    };

    const addEmail = (email: string) => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) return;

        if (!isValidEmail(trimmed)) {
            setError('Invalid email format');
            return;
        }

        if (emails.includes(trimmed)) {
            setError('Email already added');
            return;
        }

        setError(null);
        onChange([...emails, trimmed]);
        setInputValue('');
    };

    const removeEmail = (emailToRemove: string) => {
        onChange(emails.filter((e) => e !== emailToRemove));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
            e.preventDefault();
            addEmail(inputValue);
        } else if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
            // Remove last email on backspace when input is empty
            removeEmail(emails[emails.length - 1]);
        }
    };

    const handleBlur = () => {
        if (inputValue.trim()) {
            addEmail(inputValue);
        }
    };

    return (
        <div className="flex items-start gap-2 py-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 w-12 pt-1 flex-shrink-0">
                {label}:
            </span>
            <div
                className="flex-1 flex flex-wrap items-center gap-1 min-h-[32px] cursor-text"
                onClick={() => inputRef.current?.focus()}
            >
                {emails.map((email) => (
                    <span
                        key={email}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded"
                    >
                        {email}
                        {!disabled && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeEmail(email);
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </span>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setError(null);
                    }}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    placeholder={emails.length === 0 ? placeholder : ''}
                    disabled={disabled}
                    className="flex-1 min-w-[120px] bg-transparent text-gray-900 dark:text-gray-100 text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
            </div>
            {error && (
                <span className="text-xs text-red-500">{error}</span>
            )}
        </div>
    );
};

export default EmailRecipientInput;
