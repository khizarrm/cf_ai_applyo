import { drizzle } from "drizzle-orm/d1";
import { schema } from "./schema";
export { schema } from "./schema";

// Hono/Workers-friendly helper: pass in `env` (for Hono use `c.env`)
export function getDb(env: Env) {
	return drizzle(env.applyo, {
		schema,
		logger: true,
	});
}