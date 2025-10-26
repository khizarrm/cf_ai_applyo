import type { D1Database, KVNamespace, DurableObjectNamespace } from "@cloudflare/workers-types";

export interface CloudflareBindings {
    DB: D1Database;
    KV?: KVNamespace;
    Prospects: AgentNamespace<Prospects>;
    TAVILY_API_KEY: string;
    ZEROBOUNCE_API_KEY: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
}

declare global {
    namespace NodeJS {
        interface ProcessEnv extends CloudflareBindings {
            // Additional environment variables can be added here
        }
    }
}