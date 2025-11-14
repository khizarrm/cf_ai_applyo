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
      const body = await _request.json() as { company?: string };
      const company = body.company || "";
      
      if (!company) {
        return new Response(
          JSON.stringify({ error: "Company name is required" }),
          { 
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      // Check if people exist in DB first (case-insensitive by company name)
      const existingPeople = await this.checkPeopleInDB(company);
      if (existingPeople) {
        console.log(`Found existing people in DB for ${company}`);
        return new Response(
          JSON.stringify({
            ...existingPeople,
            state: this.state,
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const model = openai("gpt-4o-2024-11-20", {
        apiKey: this.env.OPENAI_API_KEY,
      });

      const result = await generateText({
          model,
          tools,
          prompt:
          `You are provided with a company name. Your task is to find **exactly 3 high-ranking individuals** (executives, founders, C-suite, senior leadership) at this company and identify the company website.

            ---
            ### Step 1: Understand the company
            From the given company name, infer:
            - Industry and sector
            - Company size (startup, mid-size, enterprise)
            - Likely organizational structure
            ---
            ### Step 2: Find company website
            Use the **searchWeb** tool to find the official company website. Search for:
            - "company name official website"
            - "company name.com"
            - "company name company website"

            ---
            ### Step 3: Search for people
            Use the **searchWeb** tool **multiple times** (at least 3-5 searches) to find real people who work at this company. Try different search strategies:

            1. Search for "company name CEO founder executives leadership team"
            2. Search for "company name management team senior leadership"
            3. Search for "company name about us team page"
            4. Search for "company name LinkedIn executives officers"
            5. Search for specific roles like "company name CTO VP Engineering"
            6. If you found a website, search for "site:website CEO founder executives leadership team"

            **IMPORTANT**: Use the searchWeb tool **several times** with different queries to ensure you find accurate, real people. Don't settle for the first search result. If you found a website, prioritize searching within that domain.

            Focus on finding:
            - CEOs, Founders, Presidents
            - C-suite executives (CTO, CFO, COO, CMO, CPO)
            - VPs and senior leadership
            - Board members (if no other info available)

            ---

            ### Step 4: Return structured JSON
            **CRITICAL**: Respond with ONLY valid JSON. No markdown, no explanations, no code blocks.

            Return exactly this structure:

            {
              "company": "Company Name",
              "website": "https://companywebsite.com", #ENSURE THIS IS THE WEBSITE OF THE COMPANY
              "people": [
                {
                  "name": "Full Name",
                  "role": "Exact Job Title"
                }
              ]
            }

            Rules:
            - Include up to 3 people max.
            - Ensure all people are real and verifiable from your searches.
            - Use full names (not just first names or initials).
            - Use accurate job titles from your research.
            - Include the company name exactly as provided and website int eh response.
            - Return ONLY the JSON object, nothing else.
            - Do not wrap in markdown code blocks.
            - Do not add any explanatory text before or after the JSON.

          <company_name>${company}</company_name>
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
            company: company,
            website: "",
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

  // Helper function to check people in DB by company name (case-insensitive)
  async checkPeopleInDB(companyName: string) {
    try {
      const results = await this.env.DB.prepare(`
        SELECT DISTINCT company_name, website, employee_name, employee_title 
        FROM companies 
        WHERE LOWER(company_name) = LOWER(?)
      `).bind(companyName).all<{
        company_name: string;
        website: string | null;
        employee_name: string;
        employee_title: string;
      }>();
      
      if (!results.results || results.results.length === 0) {
        return null;
      }
      
      // Format to match PeopleFinder response
      return {
        company: results.results[0].company_name,
        website: results.results[0].website || "",
        people: results.results.map(row => ({
          name: row.employee_name,
          role: row.employee_title || ""
        }))
      };
    } catch (error) {
      console.error("Error checking people in DB:", error);
      return null;
    }
  }

}

export default PeopleFinder;
