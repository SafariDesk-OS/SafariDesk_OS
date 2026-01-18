import { ArrowUpRight } from "lucide-react";
import React from "react";
type StatCardProps = {
  title: string;
    value: number | string;
    icon: any;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo' | 'teal' | 'gray' | 'yellow' | 'lime';
    onClick?: () => void; // Added onClick handler
};
  export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color = 'blue', onClick}) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800', 
    teal: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-800', 
    gray: 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-800', 
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800', 
    lime: 'bg-lime-50 dark:bg-lime-900/20 text-lime-600 dark:text-lime-400 border-lime-100 dark:border-lime-800', 
  };

  return (
    <div 
      onClick={onClick}
      className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 cursor-pointer h-full"
    >
      <div className="flex h-full flex-col justify-between">
        <div className="flex-1 items-center justify-between">
          <div className="flex items-center gap-2 mb-1 justify-between">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              {title}
            </p>
            <ArrowUpRight className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" size={10} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {value}
            </p>
            <div className={`p-2 rounded border-2 ${colorClasses[color]} group-hover:scale-110 transition-transform`}>
              <Icon size={16} className="drop-shadow-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
