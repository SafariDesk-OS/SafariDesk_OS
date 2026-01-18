import React from 'react';

const TicketViewSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex gap-6">
          <div className="flex-1" style={{ flexBasis: '70%' }}>
            <div className="h-7 w-3/4 rounded bg-gray-200 dark:bg-gray-700 mb-2"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700 mb-3"></div>
            <div className="flex items-center space-x-3">
              <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <div className="space-y-3">
            <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
        <div className="mt-6">
          <div className="h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700 mb-3"></div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700 mb-2"></div>
            <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketViewSkeleton;
