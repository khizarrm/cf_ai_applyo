//finds companies as well as contacts

import { Agent } from "agents";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai"

class Profiler extends Agent {
  async onStart() {
    console.log('Agent started with state:', this.state);
  }

  async onRequest(request: Request): Promise<Response> {
    const apiKey = (this as any).env?.OPENAI_API_KEY;
    const openai = createOpenAI({ apiKey });
    const model = openai("gpt-4o-mini");

    const body = (await request.json()) as { resume?: string };
    const resumeText = body?.resume ?? "";

    const result = await generateText({
        model,
        system: "You take in as input text from a resume and summarize it into ~300 words, returning the summary as a json.", 
        messages: [
          {
            role: "user",
            content: resumeText
          }
        ]
    });
    
    return new Response(
      JSON.stringify({
        result,
        state: this.state,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  
}

export default Profiler;