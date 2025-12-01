import { memo } from 'react';
import { classNames } from '~/utils/classNames';

interface PanelHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export const PanelHeader = memo(({ className, children }: PanelHeaderProps) => {
  return (
    <div
      className={classNames(
        'flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-gray-600 dark:text-gray-400 border-b border-gray-100/50 dark:border-slate-800/50 px-4 py-1.5 min-h-[38px] text-sm',
        className,
      )}
    >
      {children}
    </div>
  );
});
