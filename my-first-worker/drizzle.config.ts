import { defineConfig } from "drizzle-kit";

export default defineConfig({
	// Use SQLite dialect for Cloudflare D1
	dialect: "sqlite",
	
	// Point to your schema directory - Drizzle Kit will scan all files recursively
	schema: "./src/db/schema.ts",
	
	// Output directory for migration files
	out: "./drizzle",
	
	// Enable verbose logging during migration generation
	verbose: true,
	
	// Enable strict mode for better type safety
	strict: true,
	
	// D1-specific configuration
	driver: "d1-http",
});

