import { tool, type ToolSet } from "ai";
import { z } from "zod";

export const searchWeb = tool({
    description: "Search the web for companies matching the user's criteria", 
    inputSchema: z.object({
        query: z.string().describe("Search query for finding companies")
    }),
    execute: async ({ query }, options) => {
        const env = (options as any).env;
        
        const response = await fetch('https://api.websearchapi.ai/ai-search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.WEBSEARCH_API}`
            },
            body: JSON.stringify({
                query: query,
                maxResults: 10,
                includeContent: false,
                country: 'us',
                language: 'en'
            })
        });

        if (!response.ok) {
            throw new Error(`WebSearchAPI.ai request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("WebSearchAPI.ai search results:", data);

        // Return formatted results for the LLM
        return {
            results: data.organic.map((r: any) => ({
                title: r.title,
                url: r.url,
                content: r.description
            }))
        };
    }
});

export const tools = { searchWeb } satisfies ToolSet;