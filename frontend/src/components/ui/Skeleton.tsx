import React from 'react';

const LoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-6xl mx-auto p-6 text-gray-900 dark:text-white">
        {/* Header */}
        <div className="mb-8">
          <div className="h-8 w-80 rounded-md mb-2 animate-pulse bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-4 w-32 rounded-md animate-pulse bg-gray-100 dark:bg-gray-800"></div>
        </div>

        {/* Title and Action Buttons */}
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="h-7 w-64 rounded-md mb-3 animate-pulse bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-5 w-24 rounded-md animate-pulse bg-gray-100 dark:bg-gray-800"></div>
              <div className="h-4 w-16 rounded-md animate-pulse bg-gray-100 dark:bg-gray-800"></div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <div className="h-10 w-32 rounded-md animate-pulse bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-10 w-36 rounded-md animate-pulse bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-10 w-40 rounded-md animate-pulse bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>

        {/* Status Tags */}
        <div className="flex gap-2 mb-8">
          <div className="h-6 w-20 rounded-full animate-pulse bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-6 w-12 rounded-full animate-pulse bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-6 w-24 rounded-full animate-pulse bg-gray-200 dark:bg-gray-700"></div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Creator Section */}
          <div>
            <div className="h-5 w-16 rounded-md mb-4 animate-pulse bg-gray-100 dark:bg-gray-800"></div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full animate-pulse bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-4 w-32 rounded-md animate-pulse bg-gray-200 dark:bg-gray-700"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full animate-pulse bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-4 w-48 rounded-md animate-pulse bg-gray-200 dark:bg-gray-700"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full animate-pulse bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-4 w-28 rounded-md animate-pulse bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
          </div>

          {/* Assignment Section */}
          <div>
            <div className="h-5 w-24 rounded-md mb-4 animate-pulse bg-gray-100 dark:bg-gray-800"></div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full animate-pulse bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-4 w-28 rounded-md animate-pulse bg-gray-200 dark:bg-gray-700"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full animate-pulse bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-4 w-8 rounded-md animate-pulse bg-gray-200 dark:bg-gray-700"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full animate-pulse bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-4 w-20 rounded-md animate-pulse bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <div>
            <div className="h-5 w-20 rounded-md mb-4 animate-pulse bg-gray-100 dark:bg-gray-800"></div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full animate-pulse bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-4 w-44 rounded-md animate-pulse bg-gray-200 dark:bg-gray-700"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full animate-pulse bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-4 w-40 rounded-md animate-pulse bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="mb-8">
          <div className="h-5 w-24 rounded-md mb-4 animate-pulse bg-gray-100 dark:bg-gray-800"></div>
          <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
            <div className="h-4 w-full rounded-md mb-2 animate-pulse bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-4 w-3/4 rounded-md animate-pulse bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>

        {/* Activity Stream */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="h-5 w-5 rounded-md animate-pulse bg-gray-200 dark:bg-gray-700"></div>
            <div className="h-5 w-28 rounded-md animate-pulse bg-gray-100 dark:bg-gray-800"></div>
          </div>

          {/* Activity Item */}
          <div className="p-4 rounded-lg border-l-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full flex-shrink-0 animate-pulse bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-24 rounded-md animate-pulse bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-4 w-16 rounded-md animate-pulse bg-gray-200 dark:bg-gray-700"></div>
                  <div className="ml-auto">
                    <div className="h-3 w-8 rounded-md animate-pulse bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                </div>
                <div className="h-3 w-32 rounded-md animate-pulse bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;