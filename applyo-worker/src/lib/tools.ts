import { tool, type ToolSet } from "ai";
import { z } from "zod";

interface ExaSearchResult {
    title?: string;
    url?: string;
    text?: string;
    published_date?: string;
    author?: string;
}

interface ExaApiResponse {
    results?: ExaSearchResult[];
    autopromptString?: string;
}

export const searchWeb = tool({
    description: "Search the web for information. Use this to find people, companies, or any other information online.", 
    inputSchema: z.object({
        query: z.string().describe("The search query to find information on the web")
    }),
    execute: async ({ query }, options) => {
        console.log("calling the search tool")
        const env = (options as any).env;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout for Exa
        
        try {
            const response = await fetch('https://api.exa.ai/v1/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': env.EXA_API_KEY
                },
                body: JSON.stringify({
                    query: query,
                    num_results: 10,
                    use_autoprompt: true,
                    contents: {
                        text: {
                            max_characters: 500
                        }
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Exa AI request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json() as ExaApiResponse;
            
            return {
                results: (data.results || []).map((r: ExaSearchResult) => ({
                    title: r.title || '',
                    url: r.url || '',
                    content: r.text || ''
                }))
            };
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Search request timed out after 10 seconds');
            }
            throw error;
        }
    }
});

export const tools = { searchWeb } satisfies ToolSet;