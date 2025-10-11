import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/db/auth.schema.ts",
    out: "./drizzle",
    dialect: "sqlite",
    driver: "d1-http",
});

