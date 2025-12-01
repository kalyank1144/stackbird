import { Link } from '@remix-run/react';
import { useState } from 'react';
import { classNames } from '~/utils/classNames';

interface TopBarProps {
  projectName?: string;
  onOpenCommandPalette?: () => void;
  onDeploy?: () => void;
  onSettings?: () => void;
  onToggleChat?: () => void;
  chatVisible?: boolean;
}

export function TopBar({
  projectName = 'Untitled Project',
  onOpenCommandPalette,
  onDeploy,
  onSettings,
  onToggleChat,
  chatVisible = true,
}: TopBarProps) {
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  return (
    <header className="h-14 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 z-40">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </Link>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200" />

        {/* Project name dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
          >
            <span>{projectName}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Center section - Search */}
      <div className="flex-1 max-w-md mx-4">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center gap-3 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-sm text-gray-500"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span>Search files, commands...</span>
          <kbd className="ml-auto hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-white rounded border border-gray-200 text-gray-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Toggle Chat */}
        <button
          onClick={onToggleChat}
          className={classNames(
            'p-2 rounded-lg transition-colors',
            chatVisible ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-600',
          )}
          title={chatVisible ? 'Hide Chat' : 'Show Chat'}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>

        {/* Settings */}
        <button
          onClick={onSettings}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          title="Settings"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Deploy button */}
        <button
          onClick={onDeploy}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-black hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          Deploy
        </button>
      </div>
    </header>
  );
}
