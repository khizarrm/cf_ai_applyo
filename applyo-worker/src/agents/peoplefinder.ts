import { Agent } from "agents";
import Exa from "exa-js";
import { normalizeUrl } from "../lib/utils";
import type { CloudflareBindings } from "../env.d";

class PeopleFinder extends Agent<CloudflareBindings> {
  
  async onStart() {
    console.log('ppl finder started with state:', this.state);
  }

  async onRequest(_request: Request): Promise<Response> {
      const body = await _request.json() as {
        company?: string;
        website?: string;
        notes?: string;
      };
      const company = body.company || "";
      const website = body.website || "";
      const notes = body.notes || "";

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

      // Initialize Exa client
      const exa = new Exa(this.env.EXA_API_KEY);

      // Create detailed research prompt
      let researchPrompt = `Find information about the company "${company}". `;
      
      if (website) {
        researchPrompt += `The company's website is known to be: ${website}. `;
      }
      
      researchPrompt += `Your task is to:
1. Identify the official company website URL (if not already provided, find it)
2. Find exactly 3 high-ranking individuals at this company, prioritizing in this order:
   - Founders and co-founders
   - CEOs, Presidents, and Chief Executives
   - C-suite executives (CTO, CFO, COO, CMO, etc.)
   - VPs and senior leadership

For each person, provide:
- Full legal name (first and last name)
- Exact job title/role at the company

${notes ? `Additional context to help with the search: ${notes}` : ''}

Return the information in a structured JSON format:
{
  "company": "Company Name",
  "website": "https://companywebsite.com",
  "people": [
    {
      "name": "Full Name",
      "role": "Exact Job Title"
    }
  ]
}

Focus on finding current, active leadership. Use the most recent and authoritative sources available.`;

      try {
        // Create research task with structured output schema
        const research = await exa.research.create({
          instructions: researchPrompt,
          model: "exa-research-fast",
          outputSchema: {
            type: "object",
            required: ["company", "website", "people"],
            additionalProperties: false,
            properties: {
              company: {
                type: "string",
                description: "The official company name"
              },
              website: {
                type: "string",
                description: "The official company website URL"
              },
              people: {
                type: "array",
                maxItems: 3,
                description: "Array of up to 3 high-ranking individuals at the company",
                items: {
                  type: "object",
                  required: ["name", "role"],
                  additionalProperties: false,
                  properties: {
                    name: {
                      type: "string",
                      description: "Full legal name (first and last name)"
                    },
                    role: {
                      type: "string",
                      description: "Exact job title/role at the company"
                    }
                  }
                }
              }
            }
          }
        });

        console.log(`Research created with ID: ${research.researchId}`);

        // Stream research results
        const stream = await exa.research.get(research.researchId, { stream: true });
        
        let people: any = null;
        
        for await (const event of stream) {
          console.log("Research event:", event);
          
          // Handle research-output event type (the actual event structure from Exa)
          if ((event as any).eventType === 'research-output' && (event as any).output) {
            const output = (event as any).output;
            
            // Prefer parsed output if available (already parsed JSON)
            if (output.parsed) {
              people = output.parsed;
              console.log("Got parsed output:", people);
              break; // We got structured data, no need to continue
            } 
            // Fallback to content (JSON string) if parsed is not available
            else if (output.content) {
              try {
                people = JSON.parse(output.content);
                console.log("Parsed content output:", people);
                break;
              } catch (e) {
                console.error("Failed to parse content output:", e);
              }
            }
          }
          // Handle content events for streaming (optional, for logging)
          else if ((event as any).type === "content" && (event as any).content) {
            // Just log for debugging, we'll use the research-output event
            console.log("Content chunk:", (event as any).content);
          }
        }

        // Handle case when no data was found
        if (!people) {
          people = {
            company: company,
            website: website || "",
            people: [],
            error: "No research output received from Exa Research API"
          };
        }
        // Validate structure
        else if (!people.error) {
          if (!people.company || !Array.isArray(people.people)) {
            people = {
              company: company,
              website: website || "",
              people: [],
              error: "Invalid response structure from research"
            };
          } else {
            // Ensure we have at most 3 people
            if (people.people.length > 3) {
              people.people = people.people.slice(0, 3);
            }
          }
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

      } catch (error) {
        console.error("Exa Research API error:", error);
        return new Response(
          JSON.stringify({
            company: company,
            website: website || "",
            people: [],
            error: "Failed to complete research",
            errorMessage: error instanceof Error ? error.message : String(error),
            state: this.state,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
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
        website: normalizeUrl(results.results[0].website) || "",
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
