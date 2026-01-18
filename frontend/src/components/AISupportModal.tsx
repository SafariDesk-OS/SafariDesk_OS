import React from 'react';
import { X, Sparkles } from 'lucide-react'; // not used  Brain, Zap, TrendingUp, Target 

interface AISupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AISupportModal: React.FC<AISupportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full transform transition-all animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Green Gradient */}
          <div className="relative p-6 pb-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-t-2xl">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  AI Support Assistant
                </h2>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Live in Help Center
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 space-y-4">
            <p className="text-gray-600 dark:text-gray-300">
              Our AI assistant is now live in the Help Center! Get instant support powered by intelligent knowledge base search and smart ticket creation.
            </p>

            <ul className="space-y-2 list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
              <li>
                <strong>AI Chatbot Widget</strong> - Interactive assistant in your Help Center
              </li>
              <li>
                <strong>Smart KB Search</strong> - Instant answers from your knowledge base
              </li>
              <li>
                <strong>Auto-Categorization</strong> - Automatically categorizes new tickets
              </li>
              <li>
                <strong>Smart Routing</strong> - Routes tickets to the right department
              </li>
            </ul>

            {/* Footer Button */}

            <button
              onClick={onClose}
              className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 dark:from-primary-600 dark:to-primary-700 dark:hover:from-primary-700 dark:hover:to-primary-800 text-white font-semibold rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AISupportModal;
