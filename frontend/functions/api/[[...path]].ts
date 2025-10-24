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
    
    // Clone the response to ensure it's properly returned
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (error) {
    console.error('Error proxying to worker:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}