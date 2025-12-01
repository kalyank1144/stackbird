import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { classNames } from '~/utils/classNames';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
}

export const ModernInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
          <input
            ref={ref}
            className={classNames(
              'w-full rounded-xl border bg-white',
              'px-4 py-3 text-gray-900 placeholder-gray-400',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              icon && 'pl-10',
              rightIcon && 'pr-10',
              error ? 'border-red-300 focus:ring-red-500' : 'border-gray-200',
              className,
            )}
            {...props}
          />
          {rightIcon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{rightIcon}</div>}
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  },
);

ModernInput.displayName = 'ModernInput';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const ModernTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
        <textarea
          ref={ref}
          className={classNames(
            'w-full rounded-xl border bg-white',
            'px-4 py-3 text-gray-900 placeholder-gray-400',
            'transition-all duration-200 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            error ? 'border-red-300 focus:ring-red-500' : 'border-gray-200',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  },
);

ModernTextarea.displayName = 'ModernTextarea';

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({ onSearch, className, ...props }, ref) => {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        ref={ref}
        type="text"
        className={classNames(
          'w-full rounded-xl bg-gray-50 border-0',
          'pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-400',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white',
          className,
        )}
        placeholder="Search..."
        {...props}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 bg-gray-100 rounded border border-gray-200">
          ⌘K
        </kbd>
      </div>
    </div>
  );
});

SearchInput.displayName = 'SearchInput';
