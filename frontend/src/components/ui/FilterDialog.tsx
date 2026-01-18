import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

export interface FilterOption {
  value: string | number;
  label: string;
  count?: number;
}

export interface FilterSection {
  id: string;
  title: string;
  type: 'checkbox' | 'dropdown' | 'date-range';
  options?: FilterOption[];
  value?: (string | number)[] | string | { from: string; to: string };
  onChange?: ((value: (string | number)[] | string | { from: string; to: string }) => void) | ((value: string) => void) | ((value: string | number) => void);
}

interface FilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterSection[];
  onApply: (filters: FilterSection[]) => void;
  onReset?: () => void;
  title?: string;
}

export const FilterDialog: React.FC<FilterDialogProps> = ({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
  title = 'Filters',
}) => {
  const [tempFilters, setTempFilters] = useState<FilterSection[]>(filters);
  const [selectedCategory, setSelectedCategory] = useState<string>(filters[0]?.id || '');

  const filterValuesSignature = useMemo(
    () =>
      JSON.stringify(
        filters.map((filter) => ({
          id: filter.id,
          value: filter.value,
        })),
      ),
    [filters],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setTempFilters(filters);

    if (!filters.some((filter) => filter.id === selectedCategory)) {
      setSelectedCategory(filters[0]?.id || '');
    }
  }, [isOpen, filterValuesSignature]);

  if (!isOpen) return null;

  const handleCheckboxChange = (filterId: string, optionValue: string | number) => {
    setTempFilters(tempFilters.map(f => {
      if (f.id === filterId) {
        const currentValue = Array.isArray(f.value) ? f.value : [];
        const newValue = currentValue.includes(optionValue)
          ? currentValue.filter(v => v !== optionValue)
          : [...currentValue, optionValue];
        return { ...f, value: newValue } as FilterSection;
      }
      return f;
    }));
  };

  const handleDropdownChange = (filterId: string, optionValue: string | number) => {
    setTempFilters(tempFilters.map(f => {
      if (f.id === filterId) {
        return { ...f, value: optionValue } as FilterSection;
      }
      return f;
    }));
  };

  const handleDateChange = (filterId: string, type: 'from' | 'to', date: string) => {
    setTempFilters(tempFilters.map(f => {
      if (f.id === filterId) {
        const currentValue = (f.value as { from: string; to: string }) || { from: '', to: '' };
        return {
          ...f,
          value: { ...currentValue, [type]: date },
        } as FilterSection;
      }
      return f;
    }));
  };

  const handleApply = () => {
    tempFilters.forEach(f => {
      if (f.onChange && f.value !== undefined) {
        (f.onChange as ((value: (string | number)[] | string | { from: string; to: string }) => void))(f.value);
      }
    });
    onApply(tempFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = tempFilters.map(f => ({
      ...f,
      value: f.type === 'checkbox' ? [] : f.type === 'date-range' ? { from: '', to: '' } : 'all',
    }));
    setTempFilters(resetFilters);
    if (onReset) {
      onReset();
    }
  };

  const currentFilter = tempFilters.find(f => f.id === selectedCategory);
  const activeFilterCount = tempFilters.reduce((count, f) => {
    if (f.type === 'checkbox') {
      return count + (Array.isArray(f.value) ? f.value.length : 0);
    } else if (f.type === 'date-range') {
      const val = f.value as { from: string; to: string };
      return count + (val?.from || val?.to ? 1 : 0);
    } else if (f.type === 'dropdown') {
      return count + (f.value && f.value !== 'all' ? 1 : 0);
    }
    return count;
  }, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar - Categories */}
            <div className="w-48 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 overflow-y-auto">
              {tempFilters.map(filter => {
                const count =
                  filter.type === 'checkbox'
                    ? (Array.isArray(filter.value) ? filter.value.length : 0)
                    : filter.type === 'date-range'
                      ? ((filter.value as { from: string; to: string })?.from || (filter.value as { from: string; to: string })?.to ? 1 : 0)
                      : filter.value && filter.value !== 'all'
                        ? 1
                        : 0;

                return (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedCategory(filter.id)}
                    className={`w-full px-4 py-3 text-left text-sm border-l-4 transition-colors ${
                      selectedCategory === filter.id
                        ? 'bg-white dark:bg-gray-800 border-l-green-500 text-gray-900 dark:text-gray-100'
                        : 'bg-gray-50 dark:bg-gray-900/50 border-l-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{filter.title}</span>
                      {count > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-green-500 text-white rounded-full">
                          {count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Main Content - Filter Options */}
            <div className="flex-1 overflow-y-auto p-6">
              {currentFilter && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {currentFilter.title}
                  </h3>

                  {currentFilter.type === 'checkbox' && (
                    <div className="space-y-3">
                      {currentFilter.options?.map(option => (
                        <label
                          key={option.value}
                          className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={(Array.isArray(currentFilter.value) ? currentFilter.value : []).includes(option.value as never)}
                            onChange={() => handleCheckboxChange(currentFilter.id, option.value)}
                            className="w-4 h-4 text-green-500 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500"
                          />
                          <span className="ml-3 flex-1 text-sm text-gray-700 dark:text-gray-300">
                            {option.label}
                          </span>
                          {option.count !== undefined && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({option.count})
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}

                  {currentFilter.type === 'dropdown' && (
                    <select
                      value={typeof currentFilter.value === 'string' ? currentFilter.value : 'all'}
                      onChange={(e) => handleDropdownChange(currentFilter.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="all">All {currentFilter.title}</option>
                      {currentFilter.options?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {currentFilter.type === 'date-range' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          From Date
                        </label>
                        <input
                          type="date"
                          value={(currentFilter.value as { from: string; to: string })?.from || ''}
                          onChange={(e) => handleDateChange(currentFilter.id, 'from', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          To Date
                        </label>
                        <input
                          type="date"
                          value={(currentFilter.value as { from: string; to: string })?.to || ''}
                          onChange={(e) => handleDateChange(currentFilter.id, 'to', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Reset All
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                Apply
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold bg-green-600 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
