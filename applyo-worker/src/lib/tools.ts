import { tool, type ToolSet } from "ai";
import { z } from "zod";

export const searchWeb = tool({
    description: "Search the web for companies matching the user's criteria", 
    inputSchema: z.object({
        query: z.string().describe("Search query for finding companies")
    }),
    execute: async ({ query }, options) => {
        const env = (options as any).env;
        const { tavily } = await import("@tavily/core");
        const tvly = tavily({ apiKey: "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" });
        const response = await tvly.search(query, {
            search_depth: "basic",
            max_results: 10
        });

        console.log("Tavily search results:", response);

        // Return formatted results for the LLM
        return {
            results: response.results.map((r: any) => ({
                title: r.title,
                url: r.url,
                content: r.content
            }))
        };
    }
});

export const tools = { searchWeb } satisfies ToolSet;