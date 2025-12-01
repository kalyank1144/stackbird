import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';

export function Header() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames(
        'flex items-center px-5 border-b h-[var(--header-height)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl',
        {
          'border-transparent': !chat.started,
          'border-gray-100/50 dark:border-slate-800/50': chat.started,
        },
      )}
    >
      <div className="flex items-center gap-3 z-logo cursor-pointer">
        <div className="i-ph:sidebar-simple-duotone text-xl text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors" />
        <a href="/" className="text-2xl font-semibold flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.5 12.5c0-4 3.5-7.5 7.5-7.5 2.5 0 4.5 1 6 2.8l1-.6c.5-.3 1 .1 1 .6v3.5c0 .5-.5.8-1 .5l-1-.6c-.5 2.5-2.5 4.5-5 5.3l1.5 2.5c.3.5 0 1-.5 1h-2c-.3 0-.5-.2-.6-.4l-2-3.1c-.3 0-.6 0-.9 0-4 0-6.5-3.5-6.5-7.5z" />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            StackBird
          </span>
        </a>
      </div>
      {chat.started && ( // Display ChatDescription and HeaderActionButtons only when the chat has started.
        <>
          <span className="flex-1 px-4 truncate text-center text-gray-700 dark:text-gray-300 font-medium">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
          <ClientOnly>
            {() => (
              <div className="">
                <HeaderActionButtons chatStarted={chat.started} />
              </div>
            )}
          </ClientOnly>
        </>
      )}
    </header>
  );
}
