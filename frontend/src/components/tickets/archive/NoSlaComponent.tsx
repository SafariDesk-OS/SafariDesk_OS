import React from 'react';
import { Clock } from 'lucide-react';

const NoSlaComponent: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
      <Clock className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-6" />
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">No SLA Configuration</h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">This ticket doesn't have an associated Service Level Agreement. Contact your administrator to set up SLA policies.</p>
    </div>
  );
};

export default NoSlaComponent;
