/**
 * Pages Function to proxy all API requests to applyo-worker
 * This handles all /api/* routes and forwards them to the bound worker
 */

import type { Fetcher, EventContext } from '@cloudflare/workers-types';

interface Env {
  APPLYO_WORKER: Fetcher;
}

export async function onRequest(context: EventContext<Env, string, {}>) {
  const { request, env } = context;
  
  try {
    // Forward the request directly to the bound worker
    const response = await env.APPLYO_WORKER.fetch(request);
    
    // Return the response directly - no need to clone as it's already a proper Response
    return response;
  } catch (error) {
    console.error('Error proxying to worker:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}