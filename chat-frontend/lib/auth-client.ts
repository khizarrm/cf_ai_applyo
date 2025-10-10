import { createAuthClient } from "better-auth/react";
import { cloudflareClient } from "better-auth-cloudflare/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://my-first-worker.applyo.workers.dev";

export const authClient = createAuthClient({
  baseURL: `${API_URL}/api/auth`,
  plugins: [cloudflareClient()],
});
