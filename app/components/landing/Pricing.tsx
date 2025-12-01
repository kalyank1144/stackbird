import { classNames } from '~/utils/classNames';

interface PricingProps {
  onSelectPlan?: (plan: string) => void;
}

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for trying out StackBird',
    features: ['50 messages per day', 'Basic code generation', 'Community support', 'Public projects only'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$25',
    description: 'For serious builders and creators',
    features: [
      'Unlimited messages',
      'Advanced AI models',
      'Priority support',
      'Private projects',
      'Custom domains',
      'API access',
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'Team',
    price: '$30',
    period: '/seat/month',
    description: 'For teams building together',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Shared projects',
      'Admin dashboard',
      'SSO integration',
      'Priority support',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export function Pricing({ onSelectPlan }: PricingProps) {
  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start for free, upgrade when you need more. No hidden fees.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={classNames(
                'relative bg-white rounded-2xl border p-8 flex flex-col',
                plan.popular
                  ? 'border-blue-500 shadow-xl scale-105 z-10'
                  : 'border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-500">{plan.period || '/month'}</span>
              </div>

              <p className="mt-2 text-gray-600 text-sm">{plan.description}</p>

              <ul className="mt-8 space-y-4 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onSelectPlan?.(plan.name)}
                className={classNames(
                  'mt-8 w-full py-3.5 rounded-full font-medium transition-all duration-200',
                  plan.popular
                    ? 'bg-gray-900 text-white hover:bg-black hover:-translate-y-0.5 hover:shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:-translate-y-0.5',
                )}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Enterprise CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600">
            Need more?{' '}
            <a href="#" className="text-blue-600 font-medium hover:underline">
              Contact us for Enterprise pricing
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
