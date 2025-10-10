"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function UserMenu() {
  const { data: session } = authClient.useSession();
  const [signingOut, setSigningOut] = useState(false);

  if (!session) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await authClient.signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
        {session.user?.name || session.user?.email || 'User'}
      </div>
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {signingOut ? 'Signing out...' : 'Sign out'}
      </button>
    </div>
  );
}
