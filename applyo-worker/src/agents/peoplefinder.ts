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
    console.log("[TOOL_RESULT]", name, result);
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
          `Your goal is to identify 3 real high-ranking executives for the given company.

You MUST use the searchWeb tool for all information gathering. 
Make multiple searchWeb calls with different queries such as:
- "<Company> CEO"
- "<Company> founders"
- "<Company> executives"
- "<Company> leadership team"
- "site:${website} leadership" (if website provided)

After collecting results:
- Extract real names + titles.
- If you find fewer than 3 people, return only the ones you confirmed.
- If no valid people are found, return an empty array.

CRITICAL:
- You MUST return valid JSON ONLY.
- NEVER return explanations, apologies, reasoning, or fallback messages.
- NEVER say "cannot proceed" or similar.
- Even if all searches fail, you must still return:

{
  "people": []
}

Final output format ONLY:

{
  "people": [
    {
      "name": "Full Name",
      "role": "Exact Job Title",
      "company": "Company Name"
    }
  ]
}

Company: ${company}
Website: ${website || "Not provided"}

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
