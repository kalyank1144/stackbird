import { Link } from '@remix-run/react';
import { useState } from 'react';
import { classNames } from '~/utils/classNames';

interface NavbarProps {
  onGetStarted?: () => void;
}

export function Navbar({ onGetStarted }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Docs', href: '#docs' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.5 12.5c0-4 3.5-7.5 7.5-7.5 2.5 0 4.5 1 6 2.8l1-.6c.5-.3 1 .1 1 .6v3.5c0 .5-.5.8-1 .5l-1-.6c-.5 2.5-2.5 4.5-5 5.3l1.5 2.5c.3.5 0 1-.5 1h-2c-.3 0-.5-.2-.6-.4l-2-3.1c-.3 0-.6 0-.9 0-4 0-6.5-3.5-6.5-7.5z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">StackBird</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2">
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-black hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
            >
              Get Started Free
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={classNames(
            'md:hidden overflow-hidden transition-all duration-300',
            mobileMenuOpen ? 'max-h-64 pb-4' : 'max-h-0',
          )}
        >
          <div className="flex flex-col gap-2 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {link.name}
              </a>
            ))}
            <hr className="my-2 border-gray-100" />
            <button className="text-sm font-medium text-gray-600 px-3 py-2 text-left">Sign In</button>
            <button
              onClick={onGetStarted}
              className="bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-full mx-3"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
