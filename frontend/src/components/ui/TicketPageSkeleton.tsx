import React from 'react';
import TicketListSkeleton from './TicketListSkeleton';

const TicketPageSkeleton = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Skeleton */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
        <div className="p-4 border-b border-gray-200">
          <div className="h-8 bg-gray-200 rounded w-full animate-pulse"></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Skeleton */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="flex items-center space-x-4">
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Tickets List Skeleton */}
          <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="h-8 bg-gray-200 rounded w-full animate-pulse mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-full animate-pulse"></div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <TicketListSkeleton />
              <TicketListSkeleton />
              <TicketListSkeleton />
              <TicketListSkeleton />
            </div>
          </div>

          {/* Ticket Details Skeleton */}
          <div className="flex-1 flex flex-col overflow-hidden p-6">
            <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse mb-6"></div>
            <div className="space-y-4">
              <div className="h-24 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-48 bg-gray-200 rounded w-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketPageSkeleton;
