# Orchestrator Agent Implementation Plan

A simple orchestrator agent that understands user requests and chains calls to PeopleFinder and EmailFinder agents to find emails for people at companies.

---

## Architecture Overview

```
User (Frontend)
    ↓ HTTP Request (e.g., "find founder emails at datacurve")
Orchestrator Agent (Agent)
    ↓ Understands Intent → Calls Tools
Agent Tools (callPeopleFinder, callEmailFinder)
    ↓ Execute Agent Calls
Specialized Agents (PeopleFinder, EmailFinder)
    ↓ Return Results
Orchestrator Agent
    ↓ Formats Response
User (Frontend) - Gets emails
```

**Key Pattern**: Simple request → response agent that chains PeopleFinder → EmailFinder to return emails. No chat, no prospector logic yet.

---

## Design Decisions

### 1. **Agent Type: Simple Agent**
- Use regular `Agent` class (not `AIChatAgent`) - simpler, no chat needed
- Uses `onRequest` method like other agents
- Returns JSON response directly
- Perfect for demo purposes

### 2. **Tool-Based Agent Calling**
- Create tools that wrap agent calls:
  - `callPeopleFinder` - calls PeopleFinder agent  
  - `callEmailFinder` - calls EmailFinder agent
- LLM decides which tools to call based on user input
- Tools are chained: PeopleFinder → EmailFinder

### 3. **No Prospector Logic**
- Prospector agent not included yet
- Focus on: company name → people → emails workflow
- Can add prospector later

### 4. **Agent Access Pattern**
- Orchestrator needs access to other agent namespaces via `env`
- Use `getAgentByName(env.AgentName, "main")` pattern
- Pass agent results back to LLM for chaining

---

## Implementation Structure

### Phase 1: Orchestrator Agent Class

```typescript
// src/agents/orchestrator.ts
import { Agent } from "agents";
import { openai } from "@ai-sdk/openai";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { getAgentByName } from "agents";
import type { CloudflareBindings } from "../env.d";

class Orchestrator extends Agent<CloudflareBindings> {
  async onStart() {
    console.log('Orchestrator agent started');
  }

  async onRequest(_request: Request): Promise<Response> {
    const body = await _request.json() as { query?: string };
    const query = body.query || "";

    // Use generateText with tools that call other agents
    // LLM decides which tools to use based on query
    // Returns structured JSON with emails
  }
}
```

### Phase 2: Agent Calling Tools

Create tools that wrap agent calls:

```typescript
// Tools for calling other agents
const callPeopleFinder = tool({
  description: "Find high-ranking people (executives, founders, C-suite) at a company",
  inputSchema: z.object({
    company: z.string().describe("Company name"),
    website: z.string().optional().describe("Company website URL"),
  }),
  execute: async ({ company, website }, { env }) => {
    const agent = await getAgentByName(env.PeopleFinder, "main");
    const resp = await agent.fetch(
      new Request("http://internal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, website }),
      })
    );
    return await resp.json();
  }
});

const callEmailFinder = tool({
  description: "Find email addresses for a person at a company",
  inputSchema: z.object({
    firstName: z.string(),
    lastName: z.string(),
    company: z.string(),
    domain: z.string(),
  }),
  execute: async ({ firstName, lastName, company, domain }, { env }) => {
    const agent = await getAgentByName(env.EmailFinder, "main");
    const resp = await agent.fetch(
      new Request("http://internal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, company, domain }),
      })
    );
    return await resp.json();
  }
});

```

### Phase 3: LLM Prompt & System Message

The orchestrator needs a simple prompt that:
- Understands company names and role requests (e.g., "founder emails at datacurve")
- Chains PeopleFinder → EmailFinder automatically
- Returns structured JSON with emails

```typescript
const prompt = `You are an orchestrator that finds emails for people at companies.

Available tools:
1. **callPeopleFinder** - Find executives/leaders at a specific company (returns 3 people)
2. **callEmailFinder** - Find email addresses for a specific person

When user asks for emails (e.g., "find founder emails at datacurve" or just "datacurve"):
1. Extract the company name from the query
2. Call callPeopleFinder with the company name
3. For each person found, call callEmailFinder with their details (firstName, lastName, company, domain)
4. Return ONLY valid JSON with this structure:
{
  "company": "Company Name",
  "people": [
    {
      "name": "Full Name",
      "role": "Job Title",
      "emails": ["email1@domain.com", "email2@domain.com"]
    }
  ]
}

CRITICAL: Return ONLY the JSON object, no markdown, no explanations.`;
```

### Phase 4: Workflow Example

**User Input**: "find founder emails at datacurve" or just "datacurve"

**Orchestrator Flow**:
1. LLM extracts company name → calls `callPeopleFinder("datacurve")`
2. Tool executes → calls PeopleFinder agent → returns 3 people with names, roles, company
3. LLM sees results → calls `callEmailFinder` for each person (3 calls)
4. Tools execute → calls EmailFinder agent 3 times → returns emails for each
5. LLM formats final JSON response

**Response JSON**:
```json
{
  "company": "datacurve",
  "people": [
    {
      "name": "John Doe",
      "role": "CEO & Founder",
      "emails": ["john.doe@datacurve.com"]
    },
    {
      "name": "Jane Smith",
      "role": "CTO",
      "emails": ["jane.smith@datacurve.com"]
    }
  ]
}
```

---

## API Integration

### Add Orchestrator to Env Interface

```typescript
// src/index.ts
interface Env {
  Prospects: AgentNamespace<Prospects>;
  PeopleFinder: AgentNamespace<PeopleFinder>;
  EmailFinder: AgentNamespace<EmailFinder>;
  Orchestrator: AgentNamespace<Orchestrator>; // ADD THIS
}
```

### Register Route

Add HTTP endpoint like other agents:

```typescript
class OrchestratorRoute extends OpenAPIRoute {
  schema = {
    tags: ["Agents"],
    summary: "Call Orchestrator Agent",
    description: "Find emails for people at a company",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              query: z.string().describe("Query like 'find founder emails at datacurve' or just 'datacurve'"),
            }),
          },
        },
      },
    },
    // ... response schema
  };

  async handle(c: any) {
    // Call orchestrator agent
  }
}
```

### Frontend Integration

Simple HTTP POST to `/api/agents/orchestrator` with `{ query: "datacurve" }`

---

## Key Considerations

### 1. **Error Handling**
- Handle agent call failures gracefully
- Provide helpful error messages to user
- Retry logic for transient failures?

### 2. **Rate Limiting**
- EmailFinder calls can be expensive (email verification)
- Consider batching or limiting concurrent calls
- Add delays between multiple agent calls?

### 3. **Response Formatting**
- LLM should format agent results nicely
- Handle cases where agents return empty results
- Show progress for long-running tasks

### 4. **State Persistence**
- Do we need to persist chat history?
- If yes, follow pattern from `CHAT_AGENT.md` with D1
- If no, rely on AIChatAgent's built-in state

### 5. **Tool Result Handling**
- Tools return JSON from agents
- LLM needs to understand the structure
- May need to format results before passing to LLM

---

## Example Use Cases

### Use Case 1: Simple Company Name
**Input**: "datacurve"
**Flow**: `callPeopleFinder("datacurve")` → `callEmailFinder` (x3) → return emails

### Use Case 2: Find Founder Emails
**Input**: "find founder emails at datacurve"
**Flow**: `callPeopleFinder("datacurve")` → filter for founders → `callEmailFinder` (xN) → return emails

### Use Case 3: Find Specific Person Email
**Input**: "find email of John Doe at datacurve"
**Flow**: `callPeopleFinder("datacurve")` → find John Doe → `callEmailFinder` → return email

---

## Implementation Steps

1. ✅ **Plan** (this document)
2. Create orchestrator agent class with `Agent` (not AIChatAgent)
3. Create agent-calling tools (callPeopleFinder, callEmailFinder)
4. Implement `onRequest` with `generateText` (not streaming)
5. Add prompt for intent understanding and chaining
6. Register orchestrator in `wrangler.toml`
7. Add to `Env` interface in `index.ts`
8. Add API route in `index.ts`
9. Test with example queries ("datacurve", "find founder emails at datacurve")
10. Add error handling and edge cases

---

## Questions to Consider

1. **How to extract domain from company name?**
   - PeopleFinder returns company name but not domain
   - EmailFinder needs domain
   - Options: Extract from company website, or have LLM infer it

2. **How to handle role filtering?**
   - User says "find founder emails" - filter people by role?
   - Or let PeopleFinder return all and filter in orchestrator?

3. **Error handling for missing data?**
   - What if PeopleFinder returns no people?
   - What if EmailFinder returns no emails?
   - Return partial results or error?

---

## Next Steps

1. Review this plan
2. Decide on chat history persistence
3. Implement orchestrator agent
4. Test with example queries
5. Iterate based on results

