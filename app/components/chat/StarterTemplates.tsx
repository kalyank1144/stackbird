import React from 'react';
import type { Template } from '~/types/template';
import { STARTER_TEMPLATES } from '~/utils/constants';

interface FrameworkLinkProps {
  template: Template;
}

const FrameworkLink: React.FC<FrameworkLinkProps> = ({ template }) => (
  <a
    href={`/git?url=https://github.com/${template.githubRepo}.git`}
    data-state="closed"
    data-discover="true"
    className="items-center justify-center p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
  >
    <div
      className={`inline-block ${template.icon} w-8 h-8 text-4xl text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-all grayscale hover:grayscale-0`}
      title={template.label}
    />
  </a>
);

const StarterTemplates: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-4">
      <span className="text-sm text-gray-500 dark:text-gray-400">or start a blank app with your favorite stack</span>
      <div className="flex justify-center">
        <div className="flex flex-wrap justify-center items-center gap-2 max-w-sm">
          {STARTER_TEMPLATES.map((template) => (
            <FrameworkLink key={template.name} template={template} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StarterTemplates;
