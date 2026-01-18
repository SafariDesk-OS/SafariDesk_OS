import React from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

interface AlertProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose?: () => void;
}

const alertStyles = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-600 dark:text-red-400',
    icon: <XCircle className="w-5 h-5 text-red-500" />,
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    icon: <Info className="w-5 h-5 text-blue-500" />,
  },
};

const Alert: React.FC<AlertProps> = ({ message, type, onClose }) => {
  const styles = alertStyles[type];

  return (
    <div className={`rounded-lg p-4 flex items-start space-x-3 ${styles.bg} ${styles.border}`}>
      <div className="flex-shrink-0">{styles.icon}</div>
      <div className="flex-1">
        <p className={`text-sm ${styles.text}`}>{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
