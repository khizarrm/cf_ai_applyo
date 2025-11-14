import type { D1Database, KVNamespace, DurableObjectNamespace } from "@cloudflare/workers-types";

export interface CloudflareBindings {
    DB: D1Database;
    KV?: KVNamespace;
    Prospects: AgentNamespace<Prospects>;
    WEBSEARCH_API: string;
    ZEROBOUNCE_API_KEY: string;
    OPENAI_API_KEY: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    BETTER_AUTH_SECRET?: string;
}

declare global {
    namespace NodeJS {
        interface ProcessEnv extends CloudflareBindings {
            // Additional environment variables can be added here
        }
    }
}