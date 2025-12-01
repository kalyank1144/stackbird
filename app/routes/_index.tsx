import { json, type MetaFunction } from '@remix-run/cloudflare';
import { useNavigate } from '@remix-run/react';
import { BoidsBackground } from '~/components/ui/BoidsBackground';
import { Navbar, Hero, Features, Pricing, Footer } from '~/components/landing';

export const meta: MetaFunction = () => {
  return [
    { title: 'StackBird - From idea to app in seconds' },
    {
      name: 'description',
      content: 'Build applications faster with AI. Describe what you want, watch it come to life.',
    },
  ];
};

export const loader = () => json({});

/**
 * Landing page component for StackBird
 * Beautiful marketing page with Boids animation background
 */
export default function Index() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/app');
  };

  const handleSelectPlan = (plan: string) => {
    console.log('Selected plan:', plan);
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated background */}
      <BoidsBackground />

      {/* Content */}
      <div className="relative z-10">
        <Navbar onGetStarted={handleGetStarted} />
        <Hero onGetStarted={handleGetStarted} />
        <Features />
        <Pricing onSelectPlan={handleSelectPlan} />
        <Footer />
      </div>
    </div>
  );
}
