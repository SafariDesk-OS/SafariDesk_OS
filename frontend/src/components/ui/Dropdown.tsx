// import React, { ReactNode, useEffect, useRef } from 'react';
// import type { LucideIcon } from 'lucide-react';

// type DropdownMenuProps = {
//   isOpen: boolean;
//   onClose: () => void;
//   children: ReactNode;
// };

// export const DropdownMenu: React.FC<DropdownMenuProps> = ({ isOpen, onClose, children }) => {
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         onClose();
//       }
//     };

//     if (isOpen) {
//       document.addEventListener('mousedown', handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [isOpen, onClose]);

//   if (!isOpen) return null;

//   return (
//     <div 
//       ref={dropdownRef}
//       className="absolute right-0 top-8 mt-1 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
//       style={{ 
//         position: 'absolute',
//         zIndex: 9999 // Much higher z-index
//       }}
//     >
//       <div className="py-1">
//         {children}
//       </div>
//     </div>
//   );
// };

// type DropdownItemProps = {
//   icon?: LucideIcon;
//   children: ReactNode;
//   onClick?: () => void;
//   variant?: 'default' | 'danger';
// };

// export const DropdownItem: React.FC<DropdownItemProps> = ({
//   icon: Icon,
//   children,
//   onClick,
//   variant = 'default',
// }) => {
//   const variants = {
//     default: 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700',
//     danger: 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
//   };

//   return (
//     <button
//       className={`${variants[variant]} group flex items-center w-full px-4 py-2 text-sm transition-colors`}
//       onClick={onClick}
//     >
//       {Icon && <Icon className="mr-3 h-4 w-4" />}
//       {children}
//     </button>
//   );
// };


import React, { ReactNode, useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

type DropdownMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ isOpen, onClose, children }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-8 mt-1 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      style={{ 
        position: 'absolute',
        zIndex: 9999 // Much higher z-index
      }}
    >
      <div className="py-1">
        {children}
      </div>
    </div>
  );
};

type DropdownItemProps = {
  icon?: LucideIcon;
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'danger';
};

export const DropdownItem: React.FC<DropdownItemProps> = ({
  icon: Icon,
  children,
  onClick,
  variant = 'default',
}) => {
  const variants = {
    default: 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700',
    danger: 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
  };

  return (
    <button
      className={`${variants[variant]} group flex items-center w-full px-4 py-2 text-sm transition-colors`}
      onClick={onClick}
    >
      {Icon && <Icon className="mr-3 h-4 w-4" />}
      {children}
    </button>
  );
};

interface DropdownProps {
  trigger: ReactNode;
  options: { label: string; onClick: () => void; icon?: LucideIcon; variant?: 'default' | 'danger' }[];
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, options }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => setIsOpen(false);

  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      <DropdownMenu isOpen={isOpen} onClose={handleClose}>
        {options.map((option, index) => (
          <DropdownItem
            key={index}
            icon={option.icon}
            onClick={() => {
              option.onClick();
              handleClose();
            }}
            variant={option.variant}
          >
            {option.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </div>
  );
};
