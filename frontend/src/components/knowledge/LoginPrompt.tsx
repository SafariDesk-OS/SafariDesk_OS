import React from 'react';
import { X, LogIn } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface LoginPromptProps {
  action: string;
  onClose: () => void;
  isOpen?: boolean;
}

export const LoginPrompt: React.FC<LoginPromptProps> = ({
  action,
  onClose,
  isOpen = true,
}) => {
  const handleLogin = () => {
    // Redirect to login page or trigger login modal
    window.location.href = '/login';
  };

  const handleSignup = () => {
    // Redirect to signup page
    window.location.href = '/register';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Login Required
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              You need to be logged in to {action}. Please sign in to your account or create a new one.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleLogin}
              className="w-full"
              variant="primary"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
            <Button
              variant="outline"
              onClick={handleSignup}
              className="w-full"
            >
              Create Account
            </Button>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Continue as guest
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
