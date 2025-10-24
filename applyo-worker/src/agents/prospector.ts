import { Agent } from "agents";
import { openai } from "@ai-sdk/openai"
import { generateText, stepCountIs } from "ai";
import { tools } from "../lib/tools";

const model = openai("gpt-4o-2024-11-20");


class Prospects extends Agent {
  async onStart() {
    console.log('Agent started with state:', this.state);
  }

  async onRequest(_request: Request): Promise<Response> {
      const body = await _request.json() as { summary?: string; preferences?: string; location?: string };
      const summary = body.summary || "";
      const preferences = body.preferences || "";
      const location = body.location || ""; 

      const result = await generateText({
          model,
          tools, 
          prompt: 
          `You are provided with a short professional summary (100–200 words) describing the user's background, interests, and skills.
            Your task:
            1. Understand who this person is and what roles, industries, or companies align with their background.
            2. Use the searchWeb tool to find **real companies** that would be a **strong fit** for their skills and goals.
            3. Return **exactly 10** companies that are real and discoverable online.

            ---

            ### Step 1: Analyze the candidate
            From the given summary, infer:
            - Primary skills / tech stack
            - Likely roles (e.g. software engineer, AI researcher, product designer)
            - Preferred environments (e.g. startups, remote, research labs, design studios)
            - Possible industries (e.g. AI, fintech, edtech, SaaS)
            ${location ? `- Location context: Consider industries and companies relevant to ${location} (e.g., tech hubs, regional specializations, local market characteristics)` : ''}

            If the summary doesn't specify something, make reasonable inferences based on context.

            ---

            ### Step 2: Search for companies
            Use the **searchWeb** tool up to 5 times to identify relevant companies (prefer startups and growth-stage firms that match the inferred profile). ${location ? `When searching, consider companies with presence or relevance in ${location}. Include location context in search queries where appropriate.` : ''} You can use the tool even more to find the actual websites of the companies that you found, their exact domain. 

            ---

            ### Step 3: Return structured JSON
            **CRITICAL**: Respond with ONLY valid JSON. No markdown, no explanations, no code blocks.
            
            Return exactly this structure:

            {
              "companies": [
                {
                  "company": "Company Name",
                  "summary": "One-sentence factual summary of what the company does. Keep it brief, caveman language, like it's a note",
                  "reason": "Explain in 1 brief sentence, caveman language, why this company is match for the candidate."
                  "company_website": "official website of the company, this should be the original domain, not an url or a specific page"
                }
              ]
            }

            Rules:
            - Include exactly 10 companies (not 20 as mentioned earlier).
            - Keep the reasoning clear and personal ("because your background in ___ aligns with their focus on ___").
            - Return ONLY the JSON object, nothing else.
            - Do not wrap in markdown code blocks.
            - Do not add any explanatory text before or after the JSON.

          <user_summary>${summary}</user_summary>

          Additionally, here is some other information and prefences the user has provided for where they want to work at. Prioritize these requirments above all. This is **IMPORTANT**:

          <user_preferences>${preferences}</user_input> 
          `,          
          toolChoice: "auto",
          stopWhen: stepCountIs(10)
      });

    let companies;
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
        companies = JSON.parse(cleanText);
    } catch (e) {
        console.error("Failed to parse JSON:", e);
        console.error("Raw text response:", result.text);
        companies = { 
            companies: [], 
            error: "Failed to parse response", 
            rawText: result.text,
            parseError: e instanceof Error ? e.message : String(e)
        };
    }

    return new Response(
      JSON.stringify({
        ...companies,
        state: this.state,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  
}

export default Prospects;
