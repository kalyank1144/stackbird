import { memo, useEffect, useRef } from 'react';
import type { PreviewInfo } from '~/lib/stores/previews';

interface PortDropdownProps {
  activePreviewIndex: number;
  setActivePreviewIndex: (index: number) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (value: boolean) => void;
  setHasSelectedPreview: (value: boolean) => void;
  previews: PreviewInfo[];
}

export const PortDropdown = memo(
  ({
    activePreviewIndex,
    setActivePreviewIndex,
    isDropdownOpen,
    setIsDropdownOpen,
    setHasSelectedPreview,
    previews,
  }: PortDropdownProps) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    // sort previews, preserving original index
    const sortedPreviews = previews
      .map((previewInfo, index) => ({ ...previewInfo, index }))
      .sort((a, b) => a.port - b.port);

    // close dropdown if user clicks outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsDropdownOpen(false);
        }
      };

      if (isDropdownOpen) {
        window.addEventListener('mousedown', handleClickOutside);
      } else {
        window.removeEventListener('mousedown', handleClickOutside);
      }

      return () => {
        window.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isDropdownOpen]);

    return (
      <div className="relative z-port-dropdown" ref={dropdownRef}>
        {/* Display the active port if available, otherwise show the plug icon */}
        <button
          className="flex items-center bg-gray-100/80 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl px-2 py-1 gap-1.5 transition-colors"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span className="i-ph:plug text-base"></span>
          {previews.length > 0 && activePreviewIndex >= 0 && activePreviewIndex < previews.length ? (
            <span className="text-xs font-medium">{previews[activePreviewIndex].port}</span>
          ) : null}
        </button>
        {isDropdownOpen && (
          <div className="absolute left-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 rounded-xl shadow-2xl min-w-[140px] dropdown-animation">
            <div className="px-4 py-2 border-b border-gray-200/50 dark:border-slate-700/50 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Ports
            </div>
            {sortedPreviews.map((preview) => (
              <div
                key={preview.port}
                className="flex items-center px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                onClick={() => {
                  setActivePreviewIndex(preview.index);
                  setIsDropdownOpen(false);
                  setHasSelectedPreview(true);
                }}
              >
                <span
                  className={
                    activePreviewIndex === preview.index
                      ? 'text-blue-500 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                  }
                >
                  {preview.port}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);
