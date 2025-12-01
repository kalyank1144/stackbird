import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import type { ProgressAnnotation } from '~/types/context';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';

export default function ProgressCompilation({ data }: { data?: ProgressAnnotation[] }) {
  const [progressList, setProgressList] = React.useState<ProgressAnnotation[]>([]);
  const [expanded, setExpanded] = useState(false);
  React.useEffect(() => {
    if (!data || data.length == 0) {
      setProgressList([]);
      return;
    }

    const progressMap = new Map<string, ProgressAnnotation>();
    data.forEach((x) => {
      const existingProgress = progressMap.get(x.label);

      if (existingProgress && existingProgress.status === 'complete') {
        return;
      }

      progressMap.set(x.label, x);
    });

    const newData = Array.from(progressMap.values());
    newData.sort((a, b) => a.order - b.order);
    setProgressList(newData);
  }, [data]);

  if (progressList.length === 0) {
    return <></>;
  }

  return (
    <AnimatePresence>
      <div
        className={classNames(
          'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl',
          'border border-gray-200/50 dark:border-slate-700/50',
          'shadow-lg rounded-xl relative w-full max-w-chat mx-auto z-prompt',
          'p-1.5',
        )}
      >
        <div
          className={classNames(
            'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30',
            'p-2 rounded-xl text-blue-600 dark:text-blue-400',
            'flex',
          )}
        >
          <div className="flex-1">
            <AnimatePresence>
              {expanded ? (
                <motion.div
                  className="actions"
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: '0px' }}
                  transition={{ duration: 0.15 }}
                >
                  {progressList.map((x, i) => {
                    return <ProgressItem key={i} progress={x} />;
                  })}
                </motion.div>
              ) : (
                <ProgressItem progress={progressList.slice(-1)[0]} />
              )}
            </AnimatePresence>
          </div>
          <motion.button
            initial={{ width: 0 }}
            animate={{ width: 'auto' }}
            exit={{ width: 0 }}
            transition={{ duration: 0.15, ease: cubicEasingFn }}
            className="p-1.5 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            onClick={() => setExpanded((v) => !v)}
          >
            <div className={expanded ? 'i-ph:caret-up-bold' : 'i-ph:caret-down-bold'}></div>
          </motion.button>
        </div>
      </div>
    </AnimatePresence>
  );
}

const ProgressItem = ({ progress }: { progress: ProgressAnnotation }) => {
  return (
    <motion.div
      className={classNames('flex text-sm gap-3 text-gray-700 dark:text-gray-300')}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="flex items-center gap-1.5">
        <div>
          {progress.status === 'in-progress' ? (
            <div className="i-svg-spinners:90-ring-with-bg text-blue-500"></div>
          ) : progress.status === 'complete' ? (
            <div className="i-ph:check text-green-500"></div>
          ) : null}
        </div>
      </div>
      {progress.message}
    </motion.div>
  );
};
