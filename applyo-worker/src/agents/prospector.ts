//finds companies as well as contacts

import { Agent } from "agents";

interface Env {

}

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
    // Return the current state of the agent
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