/*
 * @ts-nocheck
 * Preventing TS checks with files presented in the video for a better presentation.
 */
import { MODEL_REGEX, PROVIDER_REGEX } from '~/utils/constants';
import { Markdown } from './Markdown';
import { useStore } from '@nanostores/react';
import { profileStore } from '~/lib/stores/profile';
import type {
  TextUIPart,
  ReasoningUIPart,
  ToolInvocationUIPart,
  SourceUIPart,
  FileUIPart,
  StepStartUIPart,
} from '@ai-sdk/ui-utils';

interface UserMessageProps {
  content: string | Array<{ type: string; text?: string; image?: string }>;
  parts:
    | (TextUIPart | ReasoningUIPart | ToolInvocationUIPart | SourceUIPart | FileUIPart | StepStartUIPart)[]
    | undefined;
}

export function UserMessage({ content, parts }: UserMessageProps) {
  const profile = useStore(profileStore);

  // Extract images from parts - look for file parts with image mime types
  const images =
    parts?.filter(
      (part): part is FileUIPart => part.type === 'file' && 'mimeType' in part && part.mimeType.startsWith('image/'),
    ) || [];

  if (Array.isArray(content)) {
    const textItem = content.find((item) => item.type === 'text');
    const textContent = stripMetadata(textItem?.text || '');

    return (
      <div className="overflow-hidden flex flex-col gap-3 items-center ">
        <div className="flex flex-row items-start justify-center overflow-hidden shrink-0 self-start">
          {profile?.avatar || profile?.username ? (
            <div className="flex items-end gap-2">
              <img
                src={profile.avatar}
                alt={profile?.username || 'User'}
                className="w-[28px] h-[28px] object-cover rounded-full ring-2 ring-blue-100 dark:ring-blue-900/50"
                loading="eager"
                decoding="sync"
              />
              <span className="text-gray-900 dark:text-white text-sm font-medium">
                {profile?.username ? profile.username : ''}
              </span>
            </div>
          ) : (
            <div className="i-ph:user-fill text-blue-500 text-2xl" />
          )}
        </div>
        <div className="flex flex-col gap-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 backdrop-blur-sm p-4 w-auto rounded-2xl mr-auto border border-blue-100/50 dark:border-blue-800/30 shadow-sm">
          {textContent && <Markdown html>{textContent}</Markdown>}
          {images.map((item, index) => (
            <img
              key={index}
              src={`data:${item.mimeType};base64,${item.data}`}
              alt={`Image ${index + 1}`}
              className="max-w-full h-auto rounded-xl"
              style={{ maxHeight: '512px', objectFit: 'contain' }}
            />
          ))}
        </div>
      </div>
    );
  }

  const textContent = stripMetadata(content);

  return (
    <div className="flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 backdrop-blur-sm px-5 p-4 w-auto rounded-2xl ml-auto border border-blue-100/50 dark:border-blue-800/30 shadow-sm">
      <div className="flex gap-3.5 mb-4">
        {images.map((item, index) => (
          <div className="relative flex rounded-xl border border-blue-200/50 dark:border-blue-700/50 overflow-hidden shadow-sm">
            <div className="h-16 w-16 bg-transparent outline-none">
              <img
                key={index}
                src={`data:${item.mimeType};base64,${item.data}`}
                alt={`Image ${index + 1}`}
                className="h-full w-full rounded-xl"
                style={{ objectFit: 'fill' }}
              />
            </div>
          </div>
        ))}
      </div>
      <Markdown html>{textContent}</Markdown>
    </div>
  );
}

function stripMetadata(content: string) {
  const artifactRegex = /<boltArtifact\s+[^>]*>[\s\S]*?<\/boltArtifact>/gm;
  return content.replace(MODEL_REGEX, '').replace(PROVIDER_REGEX, '').replace(artifactRegex, '');
}
