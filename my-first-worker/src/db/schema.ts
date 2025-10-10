import * as authSchema from "./auth.schema";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Application tables
export const chats = sqliteTable("chats", {
	id: text("id").primaryKey(),
	userId: text("user_id"),
	title: text("title"),
	createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const messages = sqliteTable("messages", {
	id: text("id").primaryKey(),
	chatId: text("chat_id").notNull(),
	role: text("role"),
	content: text("content"),
	createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Merge everything for migrations
export const schema = {
	...authSchema,
	chats,
	messages,
} as const;

