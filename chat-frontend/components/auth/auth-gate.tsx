"use client";

import { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

export function AuthGate({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-gray-500">Loading session...</span>
      </div>
    );
  }

  if (!session) {
    return <AuthSignIn />;
  }

  return <>{children}</>;
}

function AuthSignIn() {
  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow">
        <h1 className="mb-4 text-xl font-semibold text-gray-900">
          Sign in to Applyo Chat
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Continue with Google to access your conversations.
        </p>
        <button
          onClick={handleGoogleSignIn}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
