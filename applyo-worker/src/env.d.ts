import type { D1Database, KVNamespace, DurableObjectNamespace } from "@cloudflare/workers-types";

export interface CloudflareBindings {
    DB: D1Database;
    KV?: KVNamespace;
    Prospects: AgentNamespace<Prospects>;
}

declare global {
    namespace NodeJS {
        interface ProcessEnv extends CloudflareBindings {
            // Additional environment variables can be added here
        }
    }
}