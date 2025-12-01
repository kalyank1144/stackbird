import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { DeployButton } from '~/components/deploy/DeployButton';

interface HeaderActionButtonsProps {
  chatStarted: boolean;
}

export function HeaderActionButtons({ chatStarted: _chatStarted }: HeaderActionButtonsProps) {
  const [activePreviewIndex] = useState(0);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];

  const shouldShowButtons = activePreview;

  return (
    <div className="flex items-center gap-2">
      {/* Deploy Button */}
      {shouldShowButtons && <DeployButton />}

      {/* Debug Tools */}
      {shouldShowButtons && (
        <div className="flex border border-gray-200/50 dark:border-slate-700/50 rounded-xl overflow-hidden text-sm shadow-sm">
          <button
            onClick={() =>
              window.open('https://github.com/stackblitz-labs/bolt.diy/issues/new?template=bug_report.yml', '_blank')
            }
            className="items-center justify-center [&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-60 px-3 py-2 text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 flex gap-1.5 transition-all"
            title="Report Bug"
          >
            <div className="i-ph:bug" />
            <span>Report Bug</span>
          </button>
          <div className="w-px bg-white/20" />
          <button
            onClick={async () => {
              try {
                const { downloadDebugLog } = await import('~/utils/debugLogger');
                await downloadDebugLog();
              } catch (error) {
                console.error('Failed to download debug log:', error);
              }
            }}
            className="items-center justify-center [&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-60 px-3 py-2 text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 flex gap-1.5 transition-all"
            title="Download Debug Log"
          >
            <div className="i-ph:download" />
            <span>Debug Log</span>
          </button>
        </div>
      )}
    </div>
  );
}
