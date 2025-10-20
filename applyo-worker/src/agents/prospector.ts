import { Agent } from "agents";
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai";
import { tools } from "../lib/tools";

const model = openai("gpt-4o-2024-11-20");


class Prospects extends Agent {
  async onStart() {
    console.log('Agent started with state:', this.state);
  }

  async onRequest(_request: Request): Promise<Response> {
      const body = await _request.json() as { summary?: string; preferences?: string };
      const summary = body.summary || "";
      const preferences = body.preferences || ""; 

      const result = await generateText({
          model,
          tools, 
          prompt: 
          `You are provided with a short professional summary (100–200 words) describing the user's background, interests, and skills.
            Your task:
            1. Understand who this person is and what roles, industries, or companies align with their background.
            2. Use the searchWeb tool to find **real companies** (preferably startups or innovative tech firms) that would be a **strong fit** for their skills and goals.
            3. Return **exactly 10** companies that are real and discoverable online.

            ---

            ### Step 1: Analyze the candidate
            From the given summary, infer:
            - Primary skills / tech stack
            - Likely roles (e.g. software engineer, AI researcher, product designer)
            - Preferred environments (e.g. startups, remote, research labs, design studios)
            - Possible industries (e.g. AI, fintech, edtech, SaaS)

            If the summary doesn’t specify something, make reasonable inferences based on context.

            ---

            ### Step 2: Search for companies
            Use the **searchWeb** tool up to 5 times to identify relevant companies (prefer startups and growth-stage firms that match the inferred profile).

            ---

            ### Step 3: Return structured JSON
            Respond **only** with valid JSON in this structure:

            {
              "companies": [
                {
                  "company": "Company Name",
                  "summary": "One-sentence factual summary of what the company does. Keep it brief, caveman language, like it's a note",
                  "reason": "Explain in 1 brief sentence, caveman language, why this company is match for the candidate."
                }
              ]
            }

            Rules:
            - Include exactly 20 companies.
            - Keep the reasoning clear and personal (“because your background in ___ aligns with their focus on ___”).
            - Do not include markdown, explanations, or commentary outside the JSON.

          <user_summary>${summary}</user_summary>

          Additionally, here is some other information and prefences the user has provided for where they want to work at. Prioritize these requirments above all. This is **IMPORTANT**:

          <user_preferences>${preferences}</user_input> 
          `,          
          toolChoice: "auto",
          maxSteps: 15
      });

    console.log("RESPONSE:" , result)

    let companies;
    try {
        companies = JSON.parse(result.text);
    } catch (e) {
        companies = { companies: [], error: "Failed to parse response" };
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
