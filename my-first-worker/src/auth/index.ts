import type { D1Database, IncomingRequestCfProperties } from "@cloudflare/workers-types";
import { betterAuth } from "better-auth";
import { withCloudflare } from "better-auth-cloudflare";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { schema } from "../db";

// Single auth configuration that handles both CLI and runtime scenarios
function createAuth(env? : Env, cf?: IncomingRequestCfProperties) {
    const db = env ? drizzle(env.applyo, { schema, logger: true }) : ({} as any);
    
    const baseURL = env?.BASE_URL || "http://localhost:8787";
    const frontendURL = env?.FRONTEND_URL || "http://localhost:3000";
    
    return betterAuth({
        baseURL,
        secret: env?.BETTER_AUTH_SECRET || "dev-secret-key-at-least-32-chars",
        trustedOrigins: [frontendURL, baseURL],
        ...withCloudflare(
            {
                autoDetectIpAddress: true,
                geolocationTracking: true,
                cf: cf || {},
                d1: env
                    ? {
                          db,
                          options: {
                              usePlural: true,
                              debugLogs: true,
                          },
                      }
                    : undefined,
            },
            {
                emailAndPassword: {
                    enabled: true,
                },
                socialProviders: {
                    google: { 
                        clientId: env?.GOOGLE_CLIENT_ID || "", 
                        clientSecret: env?.GOOGLE_CLIENT_SECRET || "",
                        callbackURL: frontendURL, // Redirect back to frontend after OAuth
                    }, 
                },
                rateLimit: {
                    enabled: true,
                },
            }
        ),
        ...(env
            ? {}
            : {
                  database: drizzleAdapter({} as D1Database, {
                      provider: "sqlite",
                      usePlural: true,
                      debugLogs: true,
                  }),
              }),
    });
}

export const auth = createAuth();

export { createAuth };