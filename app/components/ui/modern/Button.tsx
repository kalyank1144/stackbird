import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { classNames } from '~/utils/classNames';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

export const ModernButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-medium rounded-full
      transition-all duration-200 ease-out
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    `;

    const variants = {
      primary: `
        bg-gray-900 text-white
        hover:bg-black hover:-translate-y-0.5 hover:shadow-lg
        focus:ring-gray-900
      `,
      secondary: `
        bg-white text-gray-700 border border-gray-200
        hover:bg-gray-50 hover:-translate-y-0.5
        focus:ring-gray-300
      `,
      ghost: `
        bg-transparent text-gray-600
        hover:bg-gray-100
        focus:ring-gray-300
      `,
      danger: `
        bg-red-500 text-white
        hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-lg
        focus:ring-red-500
      `,
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={classNames(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : icon ? (
          icon
        ) : null}
        {children}
      </button>
    );
  },
);

ModernButton.displayName = 'ModernButton';
