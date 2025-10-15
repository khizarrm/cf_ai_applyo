'use client';

import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="h-screen grid grid-cols-1 lg:grid-cols-5 overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Left Column - Login Form (40%) */}
      <div className="lg:col-span-2 flex items-center justify-center px-6 py-8 bg-white dark:bg-gray-900 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Sign in to continue to your account
            </p>
          </div>
          <LoginForm />
        </div>
      </div>

      {/* Right Column - Decorative (60%) */}
      <div className="hidden lg:flex lg:col-span-3 p-3 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="w-full h-full">
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-xl shadow-2xl overflow-hidden w-full h-full flex flex-col justify-center px-12 py-8">
            {/* Animated background elements */}
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000" />

            <div className="relative text-white space-y-6">
              {/* Header */}
              <div className="space-y-3">
                <h2 className="text-5xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Applyo
                </h2>
                <p className="text-lg text-blue-100 leading-relaxed max-w-2xl">
                  Automate your internship search. We find companies, discover founder emails, and send personalized cold emails—all on autopilot.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-2.5">
                {[
                  { title: 'Smart Company Discovery', desc: 'AI-powered company matching based on your profile' },
                  { title: 'Founder Email Finder', desc: 'Automatically discover verified founder contact information' },
                  { title: 'Personalized Outreach', desc: 'Send tailored cold emails that get responses' },
                  { title: 'Track & Optimize', desc: 'Monitor responses and improve your success rate' }
                ].map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white/5"
                  >
                    <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-300 mt-2" />
                    <div className="flex-1 space-y-0.5">
                      <h3 className="font-semibold text-base text-white">{feature.title}</h3>
                      <p className="text-xs text-blue-200">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="pt-4 grid grid-cols-3 gap-6 border-t border-white/20">
                <div className="text-center">
                  <div className="text-3xl font-bold">10K+</div>
                  <div className="text-xs text-blue-200 mt-0.5">Companies</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">85%</div>
                  <div className="text-xs text-blue-200 mt-0.5">Response Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">2.5K+</div>
                  <div className="text-xs text-blue-200 mt-0.5">Internships</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
