//finds companies as well as contacts

import { Agent } from "agents";
import { openai } from "@ai-sdk/openai"
const model = openai("gpt-4o-2024-11-20");

interface State {
  companiesFound: number;
  lastUpdated: null | string;
  companyNames: number;
}

type Connection = string;

class Prospects extends Agent {
  initialState = {
    companiesFound: 0, 
    lastUpdated: null, 
    companyNames: 0, 
  };

  async onStart() {
    console.log('Agent started with state:', this.state);
  }

  async onRequest(_request: Request): Promise<Response> {
    return new Response(
      JSON.stringify({
        message: "Prospector agent is running",
        state: this.state,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  
}

export default Prospects;