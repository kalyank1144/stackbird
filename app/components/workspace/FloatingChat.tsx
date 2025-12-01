import { useState, useRef, useEffect, type ReactNode } from 'react';
import { classNames } from '~/utils/classNames';

interface FloatingChatProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  children: ReactNode;
  title?: string;
}

export function FloatingChat({ isOpen, onClose, onMinimize, children, title = 'AI Assistant' }: FloatingChatProps) {
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [size, setSize] = useState({ width: 420, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.current.x;
        const newY = e.clientY - dragOffset.current.y;
        setPosition({
          x: Math.max(0, Math.min(newX, window.innerWidth - size.width)),
          y: Math.max(0, Math.min(newY, window.innerHeight - size.height)),
        });
      }

      if (isResizing) {
        setSize({
          width: Math.max(320, e.clientX - position.x),
          height: Math.max(300, e.clientY - position.y),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, position, size]);

  const handleDragStart = (e: React.MouseEvent) => {
    if (isMaximized) {
      return;
    }

    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    setIsDragging(true);
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={classNames(
        'fixed z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden',
        'transition-all duration-300 ease-out',
        isDragging && 'cursor-grabbing',
        isMaximized && 'inset-4 !w-auto !h-auto',
      )}
      style={
        isMaximized
          ? {}
          : {
              left: position.x,
              top: position.y,
              width: size.width,
              height: size.height,
            }
      }
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMinimize}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={toggleMaximize}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMaximized ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              )}
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* Resize handle */}
      {!isMaximized && (
        <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize" onMouseDown={() => setIsResizing(true)}>
          <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
          </svg>
        </div>
      )}
    </div>
  );
}
