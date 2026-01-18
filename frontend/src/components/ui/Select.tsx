// import React from 'react';
// import Select, { Props } from 'react-select';

// interface SelectProps extends Props {
//   // You can add any custom props here if needed
// }

// const CustomSelect: React.FC<SelectProps> = ({ className, ...props }) => {
//   return (
//     <Select
//       className={`react-select-container ${className || ''}`}
//       classNamePrefix="react-select"
//       classNames={{
//         control: (state) =>
//           `border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 ${state.isFocused ? 'ring-2 ring-primary-500' : ''}`,
//         input: () => 'text-gray-900 dark:text-gray-100',
//         singleValue: () => 'text-gray-900 dark:text-gray-100',
//         placeholder: () => 'text-gray-400 dark:text-gray-500',
//         menu: () => 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-md',
//         option: (state) =>
//           `${state.isFocused ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'} text-gray-900 dark:text-gray-100`,
//       }}
//       {...props}
//     />
//   );
// };

// export { CustomSelect as Select };


import React, { useState, useRef, useEffect } from 'react'

interface Option {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  id?: string
  label?: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  allowSearch?: boolean
  disabled?: boolean
  required?: boolean
  error?: string

  size?: 'sm' | 'md' | 'lg'
  className?: string
  labelClassName?: string
}

const Select: React.FC<SelectProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Choose an option...",
  allowSearch = false,
  disabled = false,
  required = false,
  error,
  size = 'md',
  className = '',
  labelClassName = ''
}) => {
    
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const selectRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Ensure options is always an array
  const safeOptions = options || []

  // Filter options based on search term
  const filteredOptions = safeOptions.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get selected option for display
  const selectedOption = safeOptions.find(option => option.value === value)

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg'
  }

  const currentSize = sizeClasses[size]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          )
          break
        case 'Enter':
          event.preventDefault()
          if (highlightedIndex >= 0) {
            handleOptionSelect(filteredOptions[highlightedIndex].value)
          }
          break
        case 'Escape':
          setIsOpen(false)
          setSearchTerm('')
          setHighlightedIndex(-1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, highlightedIndex, filteredOptions])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && allowSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, allowSearch])

  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm('')
    setHighlightedIndex(-1)
  }

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (!isOpen) {
        setSearchTerm('')
        setHighlightedIndex(-1)
      }
    }
  }

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={id}
          className={`block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select Button */}
      <button
        id={id}
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`
          w-full ${currentSize} border rounded-md shadow-sm 
          focus:outline-none focus:ring-2 focus:ring-opacity-50
          flex items-center justify-between
          transition-all duration-200
          ${error 
            ? 'text-red-600 border-red-500 focus:ring-red-500 focus:border-red-500 dark:text-red-400 dark:focus:ring-red-400 dark:focus:border-red-400' 
            : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'ring-2 ring-opacity-50' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={selectedOption ? '' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`
          absolute z-50 w-full mt-1 border rounded-md max-h-60 overflow-auto
          bg-white border-gray-300 shadow-lg dark:bg-gray-800 dark:border-gray-600 dark:shadow-xl
        `}>
          {/* Search Input */}
          {allowSearch && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-600">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setHighlightedIndex(-1)
                }}
                className={`
                  w-full px-2 py-1 text-sm border rounded
                  focus:outline-none focus:ring-1 focus:ring-opacity-50
                  bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500
                  dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-400 dark:focus:border-blue-400
                `}
              />
            </div>
          )}

          {/* Options */}
          <div role="listbox">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionSelect(option.value)}
                  disabled={option.disabled}
                  className={`
                    w-full px-3 py-2 text-left text-sm
                    transition-colors duration-150
                    ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    ${option.value === value 
                      ? 'bg-blue-50 text-blue-900 dark:bg-blue-900 dark:text-blue-100' 
                      : 'text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700'
                    }
                    ${index === highlightedIndex 
                      ? 'bg-gray-100 dark:bg-gray-700' 
                      : ''
                    }
                  `}
                  role="option"
                  aria-selected={option.value === value}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No options found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

export default Select