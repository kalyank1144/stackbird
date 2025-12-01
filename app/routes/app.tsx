import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';

export const meta: MetaFunction = () => {
  return [{ title: 'StackBird - Workspace' }, { name: 'description', content: 'Build applications faster with AI' }];
};

export const loader = () => json({});

/**
 * Main workspace for StackBird
 * Contains the chat interface and code editor
 */
export default function App() {
  return (
    <div className="flex flex-col h-full w-full bg-sb-background-depth-1">
      <BackgroundRays />
      <Header />
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
    </div>
  );
}
