import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Re-export Better Auth tables so Drizzle Kit can detect them
export { users, sessions, accounts, verifications } from "./auth.schema";
import { users, sessions, accounts, verifications } from "./auth.schema";

// Application tables
export const chats = sqliteTable("chats", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	title: text("title"),
	createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const messages = sqliteTable("messages", {
	id: text("id").primaryKey(),
	chatId: text("chat_id")
		.notNull()
		.references(() => chats.id, { onDelete: "cascade" }),
	role: text("role"),
	content: text("content"),
	createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Schema object for runtime usage (used by db/index.ts)
export const schema = {
	users,
	sessions,
	accounts,
	verifications,
	chats,
	messages,
} as const;

