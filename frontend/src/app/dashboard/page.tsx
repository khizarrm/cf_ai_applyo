'use client';

import { useEffect, useState } from 'react';
import { auth, type User, type GeolocationData } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import ResumeUpload from '@/components/ResumeUpload';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [geolocation, setGeolocation] = useState<GeolocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    const loadUserData = async () => {
      if (isPending) return; // Still loading session
      
      if (!session) {
        // Session loading is complete and no session exists
        window.location.href = '/login';
        return;
      }

      try {
        // Set user data from session
        setUser({
          id: session.user.id,
          email: session.user.email ?? null,
          name: session.user.name ?? null,
          createdAt: new Date(session.user.createdAt as any).toISOString(),
        });

        // Fetch geolocation data
        const geoData = await auth.getGeolocation();
        setGeolocation(geoData);
      } catch (err) {
        setError('Failed to load user data');
        console.error(err);
      }
    };

    loadUserData();
  }, [isPending, session]);

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      window.location.href = '/login';
    } catch (err) {
      setError('Failed to logout');
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <a href="/login" className="mt-4 inline-block text-blue-600 hover:underline">
            Go to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Powered by Better Auth + Cloudflare
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Authentication Status */}
        <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">✅</span>
            <h2 className="text-xl font-semibold text-green-800 dark:text-green-100">
              You're Authenticated!
            </h2>
          </div>
          <p className="text-sm text-green-700 dark:text-green-200">
            Your session is active. You can now test all protected API endpoints.
            The authentication cookie will automatically be sent with each request.
          </p>
        </div>

        {/* User Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            User Information
          </h2>
          <div className="space-y-3">
            <InfoRow label="Name" value={user?.name || 'Anonymous'} />
            <InfoRow label="Email" value={user?.email || 'Not set'} />
            <InfoRow label="User ID" value={user?.id || ''} />
            <InfoRow
              label="Created At"
              value={user?.createdAt ? new Date(user.createdAt).toLocaleString() : ''}
            />
          </div>
        </div>

        {/* Geolocation Info */}
        {geolocation && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Geolocation Information
            </h2>
            <div className="space-y-3">
              <InfoRow label="Timezone" value={geolocation.timezone || 'Unknown'} />
              <InfoRow label="City" value={geolocation.city || 'Unknown'} />
              <InfoRow label="Country" value={geolocation.country || 'Unknown'} />
              <InfoRow label="Region" value={geolocation.region || 'Unknown'} />
              <InfoRow label="Region Code" value={geolocation.regionCode || 'Unknown'} />
              <InfoRow label="Data Center" value={geolocation.colo || 'Unknown'} />
              {geolocation.latitude && (
                <InfoRow label="Latitude" value={geolocation.latitude} />
              )}
              {geolocation.longitude && (
                <InfoRow label="Longitude" value={geolocation.longitude} />
              )}
            </div>
          </div>
        )}

        {/* Resume Upload */}
        <ResumeUpload />

        {/* Quick Links */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Quick Links
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://applyo-worker.applyo.workers.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 p-4 rounded-lg transition-colors"
            >
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                📚 API Documentation
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                View Swagger UI and test endpoints
              </p>
            </a>
            <a
              href="/"
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-4 rounded-lg transition-colors"
            >
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                🏠 Home
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Return to homepage
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <span className="font-medium text-gray-700 dark:text-gray-300 w-32 flex-shrink-0">
        {label}:
      </span>
      <span className="text-gray-900 dark:text-gray-100 break-all">{value}</span>
    </div>
  );
}
