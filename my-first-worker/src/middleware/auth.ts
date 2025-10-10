import { createAuth } from "../auth";

/**
 * Auth guard for Cloudflare Workers (Better Auth recommended pattern)
 * Calls auth.api.getSession ONCE per request
 * 
 * @returns Object with either an error Response OR session/user data
 */
export async function requireAuth(request: Request, env: Env) {
    const auth = createAuth(env, request.cf as any); // Type cast needed for Cloudflare Workers
    
    // Log request details
    console.log('📨 Request URL:', request.url);
    console.log('🍪 Cookie header:', request.headers.get('cookie'));
    console.log('🔑 Authorization header:', request.headers.get('authorization'));
    
    const session = await auth.api.getSession({
        headers: request.headers
    });

    console.log('🔍 getSession() returned:', JSON.stringify(session, null, 2));
    console.log('🔍 Session exists?', !!session?.session);
    console.log('🔍 User exists?', !!session?.user);

    if (!session?.session) {
        return {
            error: new Response(
                JSON.stringify({ error: 'Unauthorized - Please sign in' }),
                { 
                    status: 401,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-store' // Prevent caching of auth responses
                    }
                }
            ),
            session: null,
            user: null
        };
    }

    return {
        error: null,
        session: session.session,
        user: session.user
    };
}

/**
 * Optional auth - returns session if available, but doesn't block
 * Useful for routes that work differently for authenticated users
 */
export async function getSession(request: Request, env: Env) {
    const auth = createAuth(env, request.cf as any); // Type cast needed for Cloudflare Workers
    
    const session = await auth.api.getSession({
        headers: request.headers
    });

    return {
        session: session?.session || null,
        user: session?.user || null
    };
}

