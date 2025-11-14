'use client';

import { useState } from 'react';
import { Loader2, Mail, Copy, Check } from 'lucide-react';
import { agentsApi, type OrchestratorResponse } from '@/lib/api';

export default function Home() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrchestratorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const copyToClipboard = async (email: string) => {
    await navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const data = await agentsApi.orchestrator({ query: query.trim() });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run orchestrator');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] font-serif flex flex-col">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');

        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .font-serif {
          font-family: 'DM Sans', sans-serif;
        }

        .font-sans {
          font-family: 'DM Sans', sans-serif;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite linear;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.03) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 1000px 100%;
        }
      `}</style>

      <main className="relative mx-auto w-full max-w-4xl px-6 flex-grow flex items-start pt-12">
        <div className={`w-full transition-transform duration-700 ease-out ${result || loading || error ? 'translate-y-[18vh]' : 'translate-y-[25vh]'}`}>
          {/* Heading */}
          <div className="mb-6 text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-light tracking-tight leading-[1.1] opacity-0 animate-fade-in-up">
              outreach
            </h1>
            <p className="mt-4 text-sm md:text-base font-sans font-light text-[#6a6a6a] opacity-0 animate-fade-in-up whitespace-nowrap" style={{ animationDelay: '0.05s' }}>
              use this to find emails. at minimum, make sure to add the name of the company. currently in beta testing
            </p>
          </div>

          {/* Search Form */}
          <div className="mt-8 mx-auto max-w-3xl opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center gap-3 bg-[#151515] border border-[#2a2a2a] rounded-full px-6 py-4 focus-within:border-[#4a4a4a] transition-all duration-500">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="find founders at datacurve"
                disabled={loading}
                className="flex-1 bg-transparent text-lg md:text-xl font-sans font-light tracking-tight placeholder:text-[#3a3a3a] focus:outline-none disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-white text-[#0a0a0a] rounded-full text-sm font-sans font-light tracking-wider uppercase hover:bg-[#e8e8e8] transition-all duration-300 disabled:opacity-30 disabled:hover:bg-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Searching
                  </>
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </form>
        </div>

          {/* Error State */}
          {error && (
            <div className="mt-12 opacity-0 animate-fade-in-up text-center">
              <p className="text-base font-sans font-light text-red-400/80">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="mt-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="opacity-0 animate-fade-in-up bg-[#151515] border border-[#2a2a2a] rounded-3xl p-8 flex flex-col"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {/* Name skeleton */}
                    <div className="h-9 w-3/4 bg-[#1a1a1a] rounded-lg mb-3 animate-shimmer" />
                    {/* Role skeleton */}
                    <div className="h-6 w-1/2 bg-[#1a1a1a] rounded-lg mb-6 animate-shimmer" />
                    {/* Email skeleton */}
                    <div className="space-y-3">
                      <div className="h-14 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4 animate-shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="mt-16">
              {result.people && result.people.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                {result.people.map((person, index) => (
                  <article
                    key={`${person.name}-${index}`}
                    className="opacity-0 animate-fade-in-up bg-[#151515] border border-[#2a2a2a] rounded-3xl p-8 hover:border-[#3a3a3a] transition-all duration-300 flex flex-col"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Person Info */}
                    <div className="mb-6 flex-grow">
                      <h2 className="text-3xl font-light tracking-tight mb-3">
                        {person.name}
                      </h2>
                      {person.role && (
                        <p className="text-base font-sans font-light text-[#6a6a6a] leading-relaxed">
                          {person.role}
                        </p>
                      )}
                    </div>

                    {/* Emails */}
                    {person.emails && person.emails.length > 0 ? (
                      <div className="space-y-3">
                        {person.emails.map((email, emailIndex) => (
                          <div
                            key={`${email}-${emailIndex}`}
                            className="group"
                          >
                            <div className="flex items-center justify-between gap-3 p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl hover:border-[#3a3a3a] transition-all duration-300">
                              <a
                                href={`mailto:${email}`}
                                className="font-sans text-sm font-light tracking-wide text-[#e8e8e8] hover:text-white transition-colors duration-300 truncate flex-1"
                                title={email}
                              >
                                {email}
                              </a>
                              <button
                                onClick={() => copyToClipboard(email)}
                                className="text-[#6a6a6a] hover:text-[#e8e8e8] transition-colors duration-300 flex-shrink-0"
                                title="Copy email"
                              >
                                {copiedEmail === email ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-sans font-light text-[#4a4a4a] italic">
                        No verified emails found
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="opacity-0 animate-fade-in-up text-center">
                <p className="text-xl font-light text-[#6a6a6a]">
                  No results found
                </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8">
        <p className="text-sm font-sans font-light text-[#4a4a4a]">
          made by{' '}
          <a
            href="https://khizarmalik.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6a6a6a] hover:text-[#e8e8e8] transition-colors duration-300"
          >
            Khizar
          </a>
        </p>
      </footer>
    </div>
  );
}
