import type { D1Database, KVNamespace } from "@cloudflare/workers-types";

export interface CloudflareBindings {
    DB: D1Database;
    KV?: KVNamespace;
}

declare global {
    namespace NodeJS {
        interface ProcessEnv extends CloudflareBindings {
            // Additional environment variables can be added here
        }
    }
}