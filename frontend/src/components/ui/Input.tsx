import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, iconPosition = 'left', fullWidth = false, className, ...props }, ref) => {
    const baseClasses = 'block px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100';
    
    const errorClasses = 'border-red-300 dark:border-red-500 focus:ring-red-500';
    
    const iconClasses = Icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '';

    return (
      <div className={clsx('relative', fullWidth && 'w-full')}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">
            {label}
          </label>
        )}
        
        <div className="relative">
          {Icon && (
            <div className={clsx(
              'absolute inset-y-0 flex items-center pointer-events-none',
              iconPosition === 'left' ? 'left-0 pl-3' : 'right-0 pr-3'
            )}>
              <Icon size={18} className="text-gray-400 dark:text-gray-500" />
            </div>
          )}
          
          <input
            ref={ref}
            className={clsx(
              baseClasses,
              iconClasses,
              error && errorClasses,
              fullWidth && 'w-full',
              className
            )}
            {...props}
          />
        </div>
        
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';