import { type ReactNode } from 'react';
import { classNames } from '~/utils/classNames';

interface CardProps {
  variant?: 'glass' | 'solid' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  children: ReactNode;
  hover?: boolean;
}

export function ModernCard({ variant = 'solid', padding = 'md', className, children, hover = false }: CardProps) {
  const baseStyles = 'rounded-2xl transition-all duration-200';

  const variants = {
    glass: `
      bg-white/70 backdrop-blur-xl
      border border-white/50
      shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]
    `,
    solid: `
      bg-white
      border border-gray-100
      shadow-[0_8px_30px_rgb(0,0,0,0.04)]
    `,
    outline: `
      bg-transparent
      border border-gray-200
    `,
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverStyles = hover ? 'hover:scale-[1.02] hover:shadow-lg cursor-pointer' : '';

  return (
    <div className={classNames(baseStyles, variants[variant], paddings[padding], hoverStyles, className)}>
      {children}
    </div>
  );
}

interface GlassNavProps {
  className?: string;
  children: ReactNode;
}

export function GlassNav({ className, children }: GlassNavProps) {
  return (
    <nav
      className={classNames(
        'fixed top-0 left-0 right-0 z-50',
        'bg-white/70 backdrop-blur-xl',
        'border-b border-white/50',
        'shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]',
        className,
      )}
    >
      {children}
    </nav>
  );
}

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({ icon, title, description, className }: FeatureCardProps) {
  return (
    <ModernCard variant="solid" padding="lg" hover className={classNames('text-center', className)}>
      <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 text-blue-600">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </ModernCard>
  );
}

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  onCtaClick?: () => void;
}

export function PricingCard({
  name,
  price,
  period = '/month',
  description,
  features,
  cta,
  popular,
  onCtaClick,
}: PricingCardProps) {
  return (
    <ModernCard
      variant="solid"
      padding="lg"
      className={classNames('relative flex flex-col', popular && 'ring-2 ring-blue-500 scale-105')}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
          Popular
        </div>
      )}
      <h3 className="text-xl font-bold text-gray-900">{name}</h3>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-gray-900">{price}</span>
        {price !== 'Custom' && <span className="text-gray-500">{period}</span>}
      </div>
      <p className="mt-2 text-gray-600 text-sm">{description}</p>
      <ul className="mt-6 space-y-3 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
      <button
        onClick={onCtaClick}
        className={classNames(
          'mt-6 w-full py-3 rounded-full font-medium transition-all duration-200',
          popular
            ? 'bg-gray-900 text-white hover:bg-black hover:-translate-y-0.5 hover:shadow-lg'
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
        )}
      >
        {cta}
      </button>
    </ModernCard>
  );
}
