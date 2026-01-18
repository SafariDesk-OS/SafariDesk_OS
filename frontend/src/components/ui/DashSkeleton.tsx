import React from 'react';
import { Users, Building, TrendingUp, FileText, Filter } from 'lucide-react';

const HomeLoadingSkeleton = () => {
  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all duration-300">
      {/* Header */}
      <div className="mb-8">
        <div className="h-8 w-48 rounded-lg mb-2 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
        <div className="h-4 w-32 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Active Agents Card */}
        <div className="rounded-xl border p-6 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-500/30">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div className="h-4 w-4 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
          </div>
          <div className="h-6 w-16 rounded mb-2 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
          <div className="h-8 w-12 rounded-lg mb-2 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
          <div className="h-4 w-24 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
        </div>

        {/* Departments Card */}
        <div className="rounded-xl border p-6 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/30">
              <Building className="w-6 h-6 text-green-400" />
            </div>
            <div className="h-4 w-4 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
          </div>
          <div className="h-6 w-16 rounded mb-2 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
          <div className="h-8 w-8 rounded-lg mb-2 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
          <div className="h-4 w-28 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
        </div>

        {/* Total Assets Card */}
        <div className="rounded-xl border p-6 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-500/20 border border-purple-500/30">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div className="h-4 w-4 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
          </div>
          <div className="h-6 w-20 rounded mb-2 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
          <div className="h-8 w-16 rounded-lg mb-2 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
          <div className="h-4 w-20 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
        </div>

        {/* KB Articles Card */}
        <div className="rounded-xl border p-6 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-orange-500/20 border border-orange-500/30">
              <FileText className="w-6 h-6 text-orange-400" />
            </div>
            <div className="h-4 w-4 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
          </div>
          <div className="h-6 w-20 rounded mb-2 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
          <div className="h-8 w-16 rounded-lg mb-2 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
          <div className="h-4 w-24 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets Analytics */}
        <div className="lg:col-span-2 rounded-xl border p-6 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div className="h-7 w-32 rounded-lg animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
            <div className="flex items-center gap-4">
              <div className="h-4 w-20 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
              <div className="h-8 w-24 rounded-lg border border-gray-300 dark:border-slate-600">
                <div className="flex items-center justify-between px-3 py-1">
                  <div className="h-4 w-16 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
                  <Filter className="w-4 h-4 text-gray-400 dark:text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-gray-100 dark:bg-slate-700/50">
              <div className="h-8 w-16 rounded-lg mb-2 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
              <div className="h-4 w-8 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
            </div>
            <div className="p-4 rounded-lg bg-gray-100 dark:bg-slate-700/50">
              <div className="h-8 w-12 rounded-lg mb-2 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
              <div className="h-4 w-16 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
            </div>
            <div className="p-4 rounded-lg bg-gray-100 dark:bg-slate-700/50">
              <div className="h-8 w-16 rounded-lg mb-2 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
              <div className="h-4 w-12 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
            </div>
            <div className="p-4 rounded-lg bg-gray-100 dark:bg-slate-700/50">
              <div className="h-8 w-12 rounded-lg mb-2 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
              <div className="h-4 w-16 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
            </div>
          </div>

          {/* Chart Area */}
          <div className="h-64 rounded-lg bg-gray-200 dark:bg-slate-700 relative overflow-hidden">
            <div className="absolute inset-0 flex items-end justify-center space-x-4 p-4">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded-t"
                  style={{
                    height: `${Math.random() * 80 + 20}%`,
                    width: '20px'
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="rounded-xl border p-6 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 w-28 rounded-lg animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
            <div className="h-4 w-16 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
          </div>

          {/* Ticket Item */}
          <div className="p-4 rounded-lg border mb-4 bg-gray-50 dark:bg-slate-700/30 border-gray-200 dark:border-slate-600">
            <div className="flex items-start justify-between mb-3">
              <div className="px-2 py-1 rounded text-xs bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">
                <div className="h-3 w-8 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
              </div>
              <div className="px-2 py-1 rounded text-xs bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
                <div className="h-3 w-8 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
              </div>
            </div>
            <div className="h-5 w-full rounded mb-2 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
            <div className="h-4 w-3/4 rounded mb-3 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-16 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
                <div className="h-4 w-12 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
              </div>
            </div>
          </div>

          {/* Additional skeleton ticket items */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg border mb-4 bg-gray-50 dark:bg-slate-700/30 border-gray-200 dark:border-slate-600">
              <div className="flex items-start justify-between mb-3">
                <div className="h-5 w-12 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
                <div className="h-5 w-16 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
              </div>
              <div className="h-4 w-full rounded mb-2 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
              <div className="h-4 w-2/3 rounded mb-3 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
              <div className="flex items-center justify-between">
                <div className="h-4 w-16 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
                <div className="h-4 w-20 rounded animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeLoadingSkeleton;