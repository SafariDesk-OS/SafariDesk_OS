import React from 'react';
import { clsx } from 'clsx';
import { DivideIcon } from 'lucide-react';

type IconType = typeof DivideIcon;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconType;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 text-white shadow-sm',
    secondary: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 text-white shadow-sm',
    outline: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 focus:ring-primary-500 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500 text-gray-700 dark:text-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white shadow-sm',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg',
  };
  
  const iconSize = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
      ) : (
        Icon && iconPosition === 'left' && (
          <Icon size={iconSize[size]} className="mr-2" />
        )
      )}
      
      {children}
      
      {Icon && iconPosition === 'right' && !loading && (
        <Icon size={iconSize[size]} className="ml-2" />
      )}
    </button>
  );
};

export default Button;
export { Button };
