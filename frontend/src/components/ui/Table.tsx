// import React from 'react';
// import { clsx } from 'clsx';
// import { ChevronUp, ChevronDown } from 'lucide-react';

// interface Column<T> {
//   key: keyof T;
//   header: string;
//   sortable?: boolean;
//   render?: (value: any, row: T) => React.ReactNode;
// }

// interface TableProps<T> {
//   data: T[];
//   columns: Column<T>[];
//   sortBy?: keyof T;
//   sortDirection?: 'asc' | 'desc';
//   onSort?: (key: keyof T) => void;
//   className?: string;
// }

// export function Table<T extends Record<string, any>>({
//   data,
//   columns,
//   sortBy,
//   sortDirection,
//   onSort,
//   className,
// }: TableProps<T>) {
//   return (
//     <div className={clsx('overflow-x-auto', className)}>
//       <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
//         <thead className="bg-gray-50 dark:bg-gray-800">
//           <tr>
//             {columns.map((column) => (
//               <th
//                 key={String(column.key)}
//                 className={clsx(
//                   'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
//                   column.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
//                 )}
//                 onClick={() => column.sortable && onSort?.(column.key)}
//               >
//                 <div className="flex items-center space-x-1">
//                   <span>{column.header}</span>
//                   {column.sortable && sortBy === column.key && (
//                     <div className="flex flex-col">
//                       {sortDirection === 'asc' ? (
//                         <ChevronUp size={14} className="text-primary-600" />
//                       ) : (
//                         <ChevronDown size={14} className="text-primary-600" />
//                       )}
//                     </div>
//                   )}
//                 </div>
//               </th>
//             ))}
//           </tr>
//         </thead>
//         <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
//           {data.map((row, index) => (
//             <tr
//               key={index}
//               className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
//             >
//               {columns.map((column) => (
//                 <td
//                   key={String(column.key)}
//                   className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
//                 >
//                   {column.render
//                     ? column.render(row[column.key], row)
//                     : row[column.key]}
//                 </td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }



import React from 'react';
import { clsx } from 'clsx';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  sortBy?: keyof T;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: keyof T) => void;
  className?: string;
  // Pagination props
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  showPagination?: boolean;
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  sortBy,
  sortDirection,
  onSort,
  className,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  showPagination = true,
}: TableProps<T>) {
  // Calculate pagination values
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = showPagination ? data.slice(startIndex, endIndex) : data;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && onPageChange) {
      onPageChange(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className={clsx('space-y-4', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={clsx(
                    'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                    column.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                  onClick={() => column.sortable && onSort?.(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && sortBy === column.key && (
                      <div className="flex flex-col">
                        {sortDirection === 'asc' ? (
                          <ChevronUp size={14} className="text-blue-600" />
                        ) : (
                          <ChevronDown size={14} className="text-blue-600" />
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((row, index) => (
              <tr
                key={startIndex + index}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <span>
              Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={clsx(
                'p-2 rounded-md border border-gray-300 dark:border-gray-600',
                currentPage === 1
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex space-x-1">
              {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="px-3 py-2 text-gray-500 dark:text-gray-400">...</span>
                  ) : (
                    <button
                      onClick={() => handlePageChange(page as number)}
                      className={clsx(
                        'px-3 py-2 text-sm rounded-md border',
                        currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                      )}
                    >
                      {page}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={clsx(
                'p-2 rounded-md border border-gray-300 dark:border-gray-600',
                currentPage === totalPages
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}