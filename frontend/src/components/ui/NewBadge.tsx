import React from 'react';

interface NewBadgeProps {
    className?: string;
}

/**
 * NewBadge - A green badge indicating a new customer reply on a ticket.
 * Displayed when has_new_reply is true and cleared when ticket is viewed.
 */
export const NewBadge: React.FC<NewBadgeProps> = ({ className = '' }) => {
    return (
        <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 ${className}`}
        >
            New
        </span>
    );
};

export default NewBadge;
