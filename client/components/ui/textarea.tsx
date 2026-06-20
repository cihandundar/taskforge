'use client';

import { forwardRef, TextareaHTMLAttributes, useEffect, useRef } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  autoResize?: boolean;
  maxLength?: number;
  showCharacterCount?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className = '',
      label,
      error,
      helperText,
      autoResize = false,
      maxLength,
      showCharacterCount = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const internalRef = (ref || textareaRef) as React.RefObject<HTMLTextAreaElement>;

    // Auto-resize functionality
    useEffect(() => {
      if (!autoResize || !internalRef.current) return;

      const textarea = internalRef.current;
      const resize = () => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      };

      resize();
      textarea.addEventListener('input', resize);
      return () => textarea.removeEventListener('input', resize);
    }, [autoResize, internalRef]);

    const inputId = props.id || label?.toLowerCase().replace(/\s+/g, '-');
    const currentLength = typeof props.value === 'string' ? props.value.length : 0;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-sm font-medium mb-2 ${
              error ? 'text-red-600' : 'text-gray-700'
            }`}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={internalRef}
            id={inputId}
            className={`
              w-full px-4 py-2.5 rounded-lg border
              ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-gray-900'}
              focus:outline-none focus:ring-2
              text-gray-900 placeholder-gray-400
              transition-colors resize-none
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              ${className}
            `}
            disabled={disabled}
            maxLength={maxLength}
            aria-invalid={!!error}
            aria-describedby={helperText ? `${inputId}-helper-text` : undefined}
            {...props}
          />

          {showCharacterCount && maxLength && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {currentLength}/{maxLength}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={`${inputId}-helper-text`}
            className="mt-1 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
