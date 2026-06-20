'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'Seçiniz...',
  error,
  helperText,
  disabled = false,
  required = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && !options[highlightedIndex].disabled) {
          selectOption(options[highlightedIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const selectOption = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const filteredOptions = options; // Can add search/filter later

  return (
    <div className="w-full">
      {label && (
        <label className={`block text-sm font-medium mb-2 ${error ? 'text-red-600' : 'text-gray-700'}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        ref={containerRef}
        onKeyDown={handleKeyDown}
        className="relative"
      >
        <button
          ref={buttonRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-4 py-2.5 rounded-lg border flex items-center justify-between
            text-left bg-white
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-gray-900'}
            focus:outline-none focus:ring-2
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                Sonuç bulunamadı
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectOption(option.value)}
                  disabled={option.disabled}
                  className={`
                    w-full px-4 py-2 text-left flex items-center gap-2
                    ${index === highlightedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'}
                    ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    ${option.value === value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                  `}
                >
                  {option.label}
                  {option.disabled && (
                    <span className="text-xs text-gray-400">(Seçilemez)</span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
}
