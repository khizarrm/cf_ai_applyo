# Chat Agent Implementation Plan

ChatGPT-style streaming chat with multiple sessions per user, using Vercel AI SDK + Cloudflare Agents + D1 persistence.

---

## Architecture Overview

```
Frontend (React)
    ↓ useAgent + useAgentChat hooks
API Routes (Hono)
    ↓ /api/chat endpoints
Chat Durable Object (AIChatAgent)
    ↓ Manages streaming + state
D1 Database
    ↓ Persistent storage (chats + messages tables)
```

**Key Pattern**: Each user+chat combo gets unique Durable Object instance: `{userId}:{chatId}`

---

## Phase 1: Database Schema

### Create Chat Tables

```typescript
// src/db/chat.schema.ts
import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { users } from "./auth.schema";

export const chats = sqliteTable("chats", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title"), // Auto-generated from first message
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  chatId: text("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(), // JSON stringified parts array
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});
```

### Update Schema Exports

```typescript
// src/db/schema.ts
import * as authSchema from "./auth.schema";
import * as chatSchema from "./chat.schema"; // ADD THIS

export const schema = {
  ...authSchema,
  ...chatSchema, // ADD THIS
} as const;
```

### Update DB Index Exports

```typescript
// src/db/index.ts
export * from "./chat.schema"; // ADD THIS LINE
```

### Generate Migration

```bash
npx drizzle-kit generate
npx wrangler d1 migrations apply applyo-db --remote
```

---

## Phase 2: Chat Durable Object Agent

Create agent that extends `AIChatAgent` for streaming, with D1 backup.

```typescript
// src/agents/chat.ts
import { AIChatAgent } from "agents/ai-chat-agent";
import {
  generateId,
  streamText,
  type StreamTextOnFinishCallback,
  stepCountIs,
  createUIMessageStream,
  convertToModelMessages,
  createUIMessageStreamResponse,
  type ToolSet
} from "ai";
import { openai } from "@ai-sdk/openai";
import { drizzle } from "drizzle-orm/d1";
import { chats, messages } from "../db/chat.schema";
import { eq, desc } from "drizzle-orm";
import type { UIMessage } from "ai";
import type { CloudflareBindings } from "../env.d";

const model = openai("gpt-4o-2024-11-20");

/**
 * Chat Agent - streaming AI chat with D1 persistence
 * Each instance handles one user's chat session
 */
export default class Chat extends AIChatAgent<CloudflareBindings> {
  private db: ReturnType<typeof drizzle>;
  private chatId: string;
  private userId: string;
  private initialized = false;

  constructor(state: DurableObjectState, env: CloudflareBindings) {
    super(state, env);
    this.db = drizzle(env.DB);

    // Extract userId and chatId from DO name
    // Format: "{userId}:{chatId}"
    const [userId, chatId] = this.state.id.toString().split(':');
    this.userId = userId;
    this.chatId = chatId;
  }

  /**
   * Called when agent starts - load chat history from D1
   */
  async onStart() {
    console.log('Chat agent started:', { userId: this.userId, chatId: this.chatId });

    if (!this.initialized) {
      await this.loadChatHistory();
      this.initialized = true;
    }
  }

  /**
   * Load existing messages from D1 into agent state
   */
  private async loadChatHistory() {
    try {
      const dbMessages = await this.db
        .select()
        .from(messages)
        .where(eq(messages.chatId, this.chatId))
        .orderBy(messages.createdAt);

      if (dbMessages.length > 0) {
        // Convert D1 messages to UIMessage format
        const uiMessages: UIMessage[] = dbMessages.map(msg => ({
          id: msg.id,
          role: msg.role as "user" | "assistant" | "system",
          parts: JSON.parse(msg.content), // Stored as JSON string
          metadata: {
            createdAt: new Date(msg.createdAt)
          }
        }));

        // Load into agent's message state
        await this.saveMessages(uiMessages);
        console.log(`Loaded ${uiMessages.length} messages from D1`);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      // Don't throw - allow agent to start with empty history
    }
  }

  /**
   * Handle incoming chat messages with streaming response
   */
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    _options?: { abortSignal?: AbortSignal }
  ) {
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const result = streamText({
          system: `You are a helpful AI assistant. Be concise and helpful.`,
          messages: convertToModelMessages(this.messages),
          model,
          onFinish: async (completion) => {
            // Save assistant's response to D1
            await this.saveMessageToD1({
              role: "assistant",
              content: JSON.stringify(completion.usage ? [
                { type: "text", text: completion.text }
              ] : [{ type: "text", text: completion.text }])
            });

            // Update chat's updatedAt timestamp
            await this.updateChatTimestamp();

            onFinish(completion);
          },
          stopWhen: stepCountIs(10)
        });

        writer.merge(result.toUIMessageStream());
      }
    });

    return createUIMessageStreamResponse({ stream });
  }

  /**
   * Override saveMessages to persist user messages to D1
   */
  async saveMessages(msgs: UIMessage[]) {
    // Call parent to update in-memory state
    await super.saveMessages(msgs);

    // Only save NEW user messages to D1 (assistant messages saved in onFinish)
    const newUserMessages = msgs.filter(msg =>
      msg.role === "user" &&
      !msg.id.startsWith("temp-") // Skip temporary IDs
    );

    for (const msg of newUserMessages) {
      await this.saveMessageToD1({
        role: msg.role,
        content: JSON.stringify(msg.parts)
      });
    }
  }

  /**
   * Persist single message to D1
   */
  private async saveMessageToD1(msg: { role: string; content: string }) {
    try {
      await this.db.insert(messages).values({
        id: generateId(),
        chatId: this.chatId,
        role: msg.role,
        content: msg.content,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error('Failed to save message to D1:', error);
      // Don't throw - message is still in DO state
    }
  }

  /**
   * Update chat's last activity timestamp
   */
  private async updateChatTimestamp() {
    try {
      await this.db
        .update(chats)
        .set({ updatedAt: new Date() })
        .where(eq(chats.id, this.chatId));
    } catch (error) {
      console.error('Failed to update chat timestamp:', error);
    }
  }

  /**
   * Auto-generate chat title from first message
   */
  async generateChatTitle(firstMessage: string) {
    try {
      // Check if title already exists
      const chat = await this.db
        .select()
        .from(chats)
        .where(eq(chats.id, this.chatId))
        .limit(1);

      if (chat[0]?.title) return; // Already has title

      // Generate title from first message (truncate to ~50 chars)
      const title = firstMessage.slice(0, 50).trim() +
        (firstMessage.length > 50 ? "..." : "");

      await this.db
        .update(chats)
        .set({ title })
        .where(eq(chats.id, this.chatId));
    } catch (error) {
      console.error('Failed to generate chat title:', error);
    }
  }
}
```

---

## Phase 3: API Routes

Add chat management endpoints to your Hono app.

```typescript
// src/index.ts - ADD THESE IMPORTS
import Chat from "./agents/chat";
import { drizzle } from "drizzle-orm/d1";
import { chats, messages } from "./db/chat.schema";
import { eq, desc } from "drizzle-orm";

// UPDATE ENV INTERFACE
interface Env {
  Prospects: AgentNamespace<Prospects>;
  Profiler: AgentNamespace<Profiler>;
  PeopleFinder: AgentNamespace<PeopleFinder>;
  EmailFinder: AgentNamespace<EmailFinder>;
  Chat: AgentNamespace<Chat>; // ADD THIS
  DB: D1Database;
}

// ADD THESE ROUTES BEFORE export default

/**
 * Create new chat session
 */
class CreateChatRoute extends OpenAPIRoute {
  schema = {
    tags: ["Chat 💬"],
    summary: "Create New Chat",
    description: "Creates a new chat session for the authenticated user",
    responses: {
      "200": {
        description: "Chat created successfully",
        content: {
          "application/json": {
            schema: z.object({
              chatId: z.string(),
              userId: z.string(),
              createdAt: z.number(),
            }),
          },
        },
      },
      "401": {
        description: "Unauthorized",
      },
    },
  };

  async handle(c: any) {
    const auth = c.get("auth");
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatId = crypto.randomUUID();
    const db = drizzle(c.env.DB);

    const now = Date.now();
    await db.insert(chats).values({
      id: chatId,
      userId: session.user.id,
      title: null,
      createdAt: now,
      updatedAt: now,
    });

    return {
      chatId,
      userId: session.user.id,
      createdAt: now,
    };
  }
}

/**
 * List all chats for authenticated user
 */
class ListChatsRoute extends OpenAPIRoute {
  schema = {
    tags: ["Chat 💬"],
    summary: "List User Chats",
    description: "Get all chat sessions for the authenticated user",
    responses: {
      "200": {
        description: "Chats retrieved successfully",
        content: {
          "application/json": {
            schema: z.object({
              chats: z.array(
                z.object({
                  id: z.string(),
                  title: z.string().nullable(),
                  createdAt: z.number(),
                  updatedAt: z.number(),
                })
              ),
            }),
          },
        },
      },
      "401": {
        description: "Unauthorized",
      },
    },
  };

  async handle(c: any) {
    const auth = c.get("auth");
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = drizzle(c.env.DB);
    const userChats = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, session.user.id))
      .orderBy(desc(chats.updatedAt));

    return { chats: userChats };
  }
}

/**
 * Get chat history
 */
class GetChatHistoryRoute extends OpenAPIRoute {
  schema = {
    tags: ["Chat 💬"],
    summary: "Get Chat History",
    description: "Retrieve all messages for a specific chat",
    request: {
      params: z.object({
        chatId: z.string(),
      }),
    },
    responses: {
      "200": {
        description: "Chat history retrieved",
        content: {
          "application/json": {
            schema: z.object({
              chatId: z.string(),
              messages: z.array(
                z.object({
                  id: z.string(),
                  role: z.string(),
                  content: z.string(),
                  createdAt: z.number(),
                })
              ),
            }),
          },
        },
      },
    },
  };

  async handle(c: any) {
    const auth = c.get("auth");
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await this.getValidatedData<typeof this.schema>();
    const { chatId } = data.params;

    const db = drizzle(c.env.DB);

    // Verify chat belongs to user
    const chat = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (!chat[0] || chat[0].userId !== session.user.id) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    const chatMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt);

    return {
      chatId,
      messages: chatMessages,
    };
  }
}

/**
 * Delete chat session
 */
class DeleteChatRoute extends OpenAPIRoute {
  schema = {
    tags: ["Chat 💬"],
    summary: "Delete Chat",
    description: "Delete a chat session and all its messages",
    request: {
      params: z.object({
        chatId: z.string(),
      }),
    },
    responses: {
      "200": {
        description: "Chat deleted successfully",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
            }),
          },
        },
      },
    },
  };

  async handle(c: any) {
    const auth = c.get("auth");
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await this.getValidatedData<typeof this.schema>();
    const { chatId } = data.params;

    const db = drizzle(c.env.DB);

    // Verify ownership
    const chat = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    if (!chat[0] || chat[0].userId !== session.user.id) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    // Delete chat (messages cascade delete via foreign key)
    await db.delete(chats).where(eq(chats.id, chatId));

    return {
      success: true,
      message: "Chat deleted successfully",
    };
  }
}

// REGISTER ROUTES (add before existing routes)
openapi.post("/api/chat", CreateChatRoute);
openapi.get("/api/chat", ListChatsRoute);
openapi.get("/api/chat/:chatId/history", GetChatHistoryRoute);
openapi.delete("/api/chat/:chatId", DeleteChatRoute);

// MODIFY DEFAULT EXPORT to route chat agent requests
export default {
  async fetch(request, env, ctx) {
    // Route agent requests (including chat)
    const agentResponse = await routeAgentRequest(request, env);
    if (agentResponse) return agentResponse;

    return openapi.fetch(request, env, ctx);
  }
};

// ADD CHAT EXPORT
export { Prospects, Profiler, PeopleFinder, EmailFinder, Chat };
```

---

## Phase 4: Update wrangler.toml

Add Chat Durable Object binding:

```toml
# wrangler.toml

[[durable_objects.bindings]]
name = "Chat"
class_name = "Chat"

[[migrations]]
tag = "v5"
new_sqlite_classes = ["Chat"]
```

---

## Phase 5: Frontend Integration

### Install Dependencies (if not already)

```bash
npm install ai @ai-sdk/react agents-react
```

### React Component Example

```tsx
// Chat.tsx
import { useAgent } from "agents/react";
import { useAgentChat } from "agents/ai-react";
import { useState, useEffect } from "react";

export default function Chat() {
  const [chatId, setChatId] = useState<string | null>(null);
  const [chats, setChats] = useState([]);

  // Create new chat
  const createChat = async () => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json();
    setChatId(data.chatId);
  };

  // Load user's chats
  useEffect(() => {
    fetch('/api/chat', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setChats(data.chats));
  }, []);

  // Connect to chat agent
  const agent = useAgent({
    agent: "chat",
    agentId: chatId ? `${userId}:${chatId}` : undefined,
  });

  const {
    messages,
    sendMessage,
    status,
    stop,
  } = useAgentChat({
    agent,
    enabled: !!chatId,
  });

  // Send message
  const handleSend = async (text: string) => {
    await sendMessage({
      role: "user",
      parts: [{ type: "text", text }],
    });
  };

  return (
    <div>
      {/* Chat sidebar */}
      <aside>
        <button onClick={createChat}>New Chat</button>
        {chats.map(chat => (
          <div key={chat.id} onClick={() => setChatId(chat.id)}>
            {chat.title || "New Chat"}
          </div>
        ))}
      </aside>

      {/* Chat messages */}
      <main>
        {messages.map(msg => (
          <div key={msg.id}>
            <strong>{msg.role}:</strong>
            {msg.parts.map((part, i) => (
              part.type === "text" && <p key={i}>{part.text}</p>
            ))}
          </div>
        ))}
      </main>

      {/* Input */}
      <form onSubmit={(e) => {
        e.preventDefault();
        const input = e.currentTarget.message;
        handleSend(input.value);
        input.value = "";
      }}>
        <input name="message" disabled={status === "streaming"} />
        <button type="submit">Send</button>
        {status === "streaming" && <button onClick={stop}>Stop</button>}
      </form>
    </div>
  );
}
```

---

## Phase 6: Testing Checklist

- [ ] D1 migrations applied successfully
- [ ] Create new chat via API returns chatId
- [ ] List chats shows user's chats only
- [ ] Send message streams response token-by-token
- [ ] Messages persist in D1 after refresh
- [ ] Chat history loads when switching between chats
- [ ] Delete chat removes from D1 and sidebar
- [ ] Multiple users can't access each other's chats
- [ ] Chat title auto-generates from first message

---

## Key Differences from Your Existing Agents

| Aspect | Existing Agents | Chat Agent |
|--------|----------------|------------|
| **Base Class** | `Agent` | `AIChatAgent` |
| **Response Type** | `generateText` (complete) | `streamText` (streaming) |
| **Method** | `onRequest` | `onChatMessage` |
| **State** | Durable Object only | DO + D1 backup |
| **Multi-instance** | Single (e.g., "main") | Per user+chat combo |

---

## Architecture Decisions

✅ **Why D1 + Durable Object?**
- DO: Fast in-memory state, handles streaming
- D1: Persistent backup, survives DO restarts

✅ **Why `{userId}:{chatId}` naming?**
- Ensures each user+chat gets isolated DO instance
- Prevents data leakage between users
- Allows concurrent chats per user

✅ **Why save messages twice (DO + D1)?**
- DO state can be evicted after inactivity
- D1 ensures chat history persists long-term
- DO loads from D1 on first access

---

## Next Steps

1. ✅ Review this plan
2. Create D1 schema + migration
3. Implement Chat agent
4. Add API routes
5. Update wrangler.toml
6. Build frontend UI
7. Test end-to-end

Any questions or adjustments needed?
