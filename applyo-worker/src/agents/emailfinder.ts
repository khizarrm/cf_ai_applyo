import { Agent } from "agents";
import { openai } from "@ai-sdk/openai"
import { generateText, stepCountIs } from "ai";
import { tools } from "../lib/tools";
import { verifyEmail } from "../lib/utils";
import type { CloudflareBindings } from "../env.d";

class EmailFinder extends Agent<CloudflareBindings> {
  async onStart() {
    console.log('Agent started with state:', this.state);
  }

  async onRequest(_request: Request): Promise<Response> {
      const body = await _request.json() as { firstName?: string; lastName?: string; company?: string; domain?: string };
      const firstName = body.firstName || "";
      const lastName = body.lastName || "";
      const company = body.company || "";
      const domain = body.domain || "";

      const model = openai("gpt-4o-2024-11-20", {
        apiKey: this.env.OPENAI_API_KEY,
      });

      const result = await generateText({
          model,
          tools,
          prompt: `You are a professional email finder for executives.
Your goal: discover **likely real** email addresses for ${firstName} ${lastName} (${company}) using open-web intelligence.

1️⃣ Run 5–10 searches with searchWeb to collect clues (GitHub, press releases, Personal websites, LinkedIn, Crunchbase, RocketReach, etc.).
2️⃣ Extract only email addresses with the same domain (${domain}) or verified patterns.
3️⃣ Derive possible patterns if nothing direct shows up.

Common formats:
- {first}@{domain}
- {first}.{last}@{domain}
- {f}{last}@{domain}
- {first}{last}@{domain}
- role emails (ceo@, founders@, contact@)

4️⃣ Return ONLY valid JSON (no markdown, no explanations):
{
  "emails": ["email1@domain.com", "email2@domain.com"],
  "pattern_found": "e.g. firstname.lastname",
  "research_notes": "summary of where clues came from"
}

CRITICAL RULES:
- Return ONLY the JSON object above, nothing else
- Exclude emails which are omitted by marks such as 'o****@gmail.com'
- No markdown code blocks (\`\`\`json\`\`\`)
- Prioritize results from credible domains
- Minimum 3, max 8 results
- Use **searchWeb** tool multiple times if needed
- If no credible sources found, return 3 educated guesses based on common patterns
- Ensure the JSON is valid and parseable

Don't stop after using the tools, make sure to return some emails no matter what
`,
          toolChoice: "auto",
          stopWhen: stepCountIs(10)
      });
    
    console.log("result text: ", result)

    let emailResult;
    try {
        if (!result.text || result.text.trim().length === 0) {
            throw new Error("Empty response from AI model");
        }

        let cleanText = result.text.trim();

        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanText = jsonMatch[0];
        }

        if (!cleanText || cleanText.trim().length === 0) {
            throw new Error("No valid JSON found in response");
        }

        console.log("Cleaned text for parsing:", cleanText);
        emailResult = JSON.parse(cleanText);

        if (!emailResult.emails || !Array.isArray(emailResult.emails)) {
            throw new Error("Invalid JSON structure: missing emails array");
        }

    } catch (e) {
        console.error("Failed to parse JSON:", e);
        console.error("Raw text response:", result.text);
        emailResult = {
            emails: [],
            pattern_found: "none",
            research_notes: "Failed to parse response - AI model returned empty or invalid JSON",
            error: e instanceof Error ? e.message : String(e),
            rawText: result.text
        };
    }

    let verifiedEmails: string[] = [];
    if (emailResult.emails && emailResult.emails.length > 0) {
        console.log("Verifying emails:", emailResult.emails);
        const verificationPromises = emailResult.emails.map(async (email: string) => {
            try {
                const status = await verifyEmail(email, this.env);
                console.log(`Email ${email} verification status: ${status}`);
                return (status === "valid") ? email : null;
            } catch (error) {
                console.error(`Failed to verify ${email}:`, error);
                return null;
            }
        });

        const results = await Promise.all(verificationPromises);
        verifiedEmails = results.filter((email): email is string => email !== null);
    }

    const finalResult = verifiedEmails.length > 0
        ? {
            emails: verifiedEmails,
            pattern_found: emailResult.pattern_found,
            research_notes: emailResult.research_notes,
            verification_summary: `${verifiedEmails.length} out of ${emailResult.emails.length} emails verified`
          }
        : {
            emails: [],
            pattern_found: emailResult.pattern_found || "none",
            research_notes: "No verified emails found",
            verification_summary: `0 out of ${emailResult.emails?.length || 0} emails verified`
          };

    return new Response(
      JSON.stringify({
        ...finalResult,
        state: this.state,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  }

}

export default EmailFinder;
