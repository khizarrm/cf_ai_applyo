/**
 * Pages Function to proxy all API requests to applyo-worker
 * This handles all /api/* routes and forwards them to the bound worker
 * The catchall parameter will be available as context.params.catchall (array)
 */

import type { Fetcher, EventContext } from '@cloudflare/workers-types';

interface Env {
  APPLYO_WORKER: Fetcher;
}

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// Handle OPTIONS preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function onRequest(context: EventContext<Env, string, {}>) {
  const { request, env } = context;
  
  try {
    // Forward the request directly to the bound worker
    const response = await env.APPLYO_WORKER.fetch(request);
    
    // Create a new response with CORS headers
    const corsResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        ...corsHeaders,
      },
    });
    
    return corsResponse;
  } catch (error) {
    console.error('Error proxying to worker:', error);
    return new Response('Internal Server Error', { 
      status: 500,
      headers: corsHeaders,
    });
  }
}