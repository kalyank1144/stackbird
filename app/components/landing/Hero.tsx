interface HeroProps {
  onGetStarted?: () => void;
}

export function Hero({ onGetStarted }: HeroProps) {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 mb-8 animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-700">Now with AI-powered code generation</span>
        </div>

        {/* Headline */}
        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6 animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          From idea to app
          <br />
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent bg-[length:200%_200%] animate-gradient">
            in seconds.
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          Describe what you want to build. Watch AI create it in real-time. No setup. No configuration. Just start
          building.
        </p>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
          style={{ animationDelay: '300ms' }}
        >
          <button
            onClick={onGetStarted}
            className="group w-full sm:w-auto bg-gray-900 text-white text-base font-medium px-8 py-4 rounded-full hover:bg-black hover:-translate-y-1 hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>✨</span>
            <span>Start Building</span>
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button className="w-full sm:w-auto bg-white text-gray-700 text-base font-medium px-8 py-4 rounded-full border border-gray-200 hover:bg-gray-50 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Watch Demo
          </button>
        </div>

        {/* Trust badge */}
        <p className="mt-6 text-sm text-gray-500 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          No credit card required • Free tier available
        </p>

        {/* Demo Preview */}
        <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <div className="relative max-w-5xl mx-auto">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl blur-2xl" />

            {/* Preview card */}
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1.5 bg-white rounded-lg text-sm text-gray-400 border border-gray-200">
                    stackbird.app
                  </div>
                </div>
              </div>

              {/* Preview content placeholder */}
              <div className="aspect-[16/9] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4.5 12.5c0-4 3.5-7.5 7.5-7.5 2.5 0 4.5 1 6 2.8l1-.6c.5-.3 1 .1 1 .6v3.5c0 .5-.5.8-1 .5l-1-.6c-.5 2.5-2.5 4.5-5 5.3l1.5 2.5c.3.5 0 1-.5 1h-2c-.3 0-.5-.2-.6-.4l-2-3.1c-.3 0-.6 0-.9 0-4 0-6.5-3.5-6.5-7.5z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-lg">AI-powered development environment</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </section>
  );
}
