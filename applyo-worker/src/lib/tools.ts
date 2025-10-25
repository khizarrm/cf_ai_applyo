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

export const verifyEmail = tool({
    description: "Verify if an email address is valid using ZeroBounce API",
    inputSchema: z.object({
        email: z.string().email().describe("Email address to verify")
    }),
    execute: async ({ email }) => {
        const apiKey = "e8f1d1eee4e444e996351966d451dfd6";
        const url = `https://api.zerobounce.net/v2/validate?api_key=${apiKey}&email=${encodeURIComponent(email)}`;

        const response = await fetch(url);

        console.log("the response: ", response)
        const data = await response.json() as {
            address: string;
            status: string;
            sub_status: string;
            account: string;
            domain: string;
            did_you_mean: string;
            domain_age_days: string;
            free_email: boolean;
            mx_found: boolean;
            mx_record: string;
            smtp_provider: string;
            firstname: string;
            lastname: string;
            gender: string;
            country: string;
            region: string;
            city: string;
            zipcode: string;
            processed_at: string;
        };

        console.log("ZeroBounce verification result:", data);

        return {
            status: data.status
        };
    }
});

export const tools = { searchWeb, verifyEmail } satisfies ToolSet;