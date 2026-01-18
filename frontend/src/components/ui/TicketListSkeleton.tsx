import React from 'react';

const TicketListSkeleton = () => {
  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="flex-1 min-w-0">
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse mb-2"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-5 bg-gray-200 rounded-full w-16 animate-pulse"></div>
              <div className="h-5 bg-gray-200 rounded-full w-16 animate-pulse"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketListSkeleton;
