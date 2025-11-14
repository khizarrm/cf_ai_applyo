import { Agent } from "agents";
import { openai } from "@ai-sdk/openai"
import { generateText, stepCountIs } from "ai";
import { tools } from "../lib/tools";
import type { CloudflareBindings } from "../env.d";

class PeopleFinder extends Agent<CloudflareBindings> {
  
  async onStart() {
    console.log('ppl finder started with state:', this.state);
  }

  async onBeforeTool({ name, args }) {
    console.log("[TOOL_CALL]", name, args);
  }

  async onAfterTool({ name, result }) {
    console.log("[TOOL_RESULT]", name, JSON.stringify(result, null, 2));
  }

  async onRequest(_request: Request): Promise<Response> {
      const body = await _request.json() as { company?: string; website?: string };
      const company = body.company || "";
      const website = body.website || "";
      

      const model = openai("gpt-4o-2024-11-20", {
        apiKey: this.env.OPENAI_API_KEY,
      });

      const result = await generateText({
          model,
          tools,
          prompt:
          `You are provided with a company name and website. Your task is to find **exactly 3 high-ranking individuals** (executives, founders, C-suite, senior leadership) at this company.
            ---
            ### Step 1: Understand the company
            From the given company name, infer:
            - Industry and sector
            - Company size (startup, mid-size, enterprise)
            - Likely organizational structure
            ---
            ### Step 2: Search for people
            Use the **searchWeb** tool **multiple times** (at least 3-5 searches) to find real people who work at this company. Try different search strategies:

            1. Search for "site:website CEO founder executives leadership team" (if website provided)
            2. Search for "company name CEO founder executives leadership team"
            3. Search for "company name management team senior leadership"
            4. Search for "company name about us team page"
            5. Search for "company name LinkedIn executives officers"
            6. Search for specific roles like "company name CTO VP Engineering"

            **IMPORTANT**: Use the searchWeb tool **several times** with different queries to ensure you find accurate, real people. Don't settle for the first search result. If a website is provided, prioritize searching within that domain.

            Focus on finding:
            - CEOs, Founders, Presidents
            - C-suite executives (CTO, CFO, COO, CMO, CPO)
            - VPs and senior leadership
            - Board members (if no other info available)

            ---

            ### Step 3: Return structured JSON
            **CRITICAL**: Respond with ONLY valid JSON. No markdown, no explanations, no code blocks.

            Return exactly this structure:

            {
              "people": [
                {
                  "name": "Full Name",
                  "role": "Exact Job Title",
                  "company": "Company Name"
                }
              ]
            }

            Rules:
            - Include exactly 3 people (not more, not less).
            - Ensure all people are real and verifiable from your searches.
            - Use full names (not just first names or initials).
            - Use accurate job titles from your research.
            - Return ONLY the JSON object, nothing else.
            - Do not wrap in markdown code blocks.
            - Do not add any explanatory text before or after the JSON.

          <company_name>${company}</company_name>
          <company_website>${website}</company_website>
          `,
          toolChoice: "auto",
          stopWhen: stepCountIs(20),
          temperature: 0.4
      });

    let people;
    try {
        let cleanText = result.text.trim();

        // Remove markdown code blocks if present
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanText = jsonMatch[0];
        }

        console.log("Cleaned text for parsing:", cleanText);
        console.log("Tool calls count:", result.toolCalls?.length || 0);
        if (result.toolCalls && result.toolCalls.length > 0) {
          console.log("Tool calls:", result.toolCalls.map(tc => ({
            toolName: 'toolName' in tc ? tc.toolName : 'unknown',
            toolCallId: 'toolCallId' in tc ? tc.toolCallId : 'unknown'
          })));
        }
        if (result.toolResults && result.toolResults.length > 0) {
          console.log("Tool results:", result.toolResults.map((tr, idx) => ({
            index: idx,
            toolCallId: 'toolCallId' in tr ? tr.toolCallId : 'unknown',
            result: 'result' in tr ? JSON.stringify(tr.result, null, 2) : 'no result'
          })));
        }
        people = JSON.parse(cleanText);
    } catch (e) {
        console.error("Failed to parse JSON:", e);
        console.error("Raw text response:", result.text);
        people = {
            people: [],
            error: "Failed to parse response",
            rawText: result.text,
            parseError: e instanceof Error ? e.message : String(e)
        };
    }

    return new Response(
      JSON.stringify({
        ...people,
        state: this.state,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  }

}

export default PeopleFinder;
