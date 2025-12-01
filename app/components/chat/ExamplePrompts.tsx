import React from 'react';

const EXAMPLE_PROMPTS = [
  { text: 'Create a mobile app about bolt.diy' },
  { text: 'Build a todo app in React using Tailwind' },
  { text: 'Build a simple blog using Astro' },
  { text: 'Create a cookie consent form using Material UI' },
  { text: 'Make a space invaders game' },
  { text: 'Make a Tic Tac Toe game in html, css and js only' },
];

export function ExamplePrompts(sendMessage?: { (event: React.UIEvent, messageInput?: string): void | undefined }) {
  return (
    <div id="examples" className="relative flex flex-col gap-9 w-full max-w-3xl mx-auto flex justify-center mt-6">
      <div
        className="flex flex-wrap justify-center gap-2"
        style={{
          animation: '.25s ease-out 0s 1 _fade-and-move-in_g2ptj_1 forwards',
        }}
      >
        {EXAMPLE_PROMPTS.map((examplePrompt, index: number) => {
          return (
            <button
              key={index}
              onClick={(event) => {
                sendMessage?.(event, examplePrompt.text);
              }}
              className="border border-gray-200/50 dark:border-slate-700/50 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-1.5 text-xs transition-all hover:border-blue-200/50 dark:hover:border-blue-800/50 hover:shadow-sm"
            >
              {examplePrompt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
