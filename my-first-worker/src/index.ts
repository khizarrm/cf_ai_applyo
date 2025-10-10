/**
 * Authenticated Chat API with Better Auth & D1 Database
 * 
 * Auth Endpoints:
 * - /api/auth/* - Better Auth handler (sign in, sign up, OAuth, etc.)
 * 
 * Protected Chat Endpoints (require authentication):
 * - POST /chat/start - Create a new chat
 * - POST /chat/:id/message - Send a message and get a reply
 * - GET /chat/:id - Fetch chat history
 * - GET /chats - List all chats for authenticated user (paginated)
 * - DELETE /chat/:id - Delete chat and all messages
 */

import { createAuth } from './auth';
import { requireAuth } from './middleware/auth';

interface ChatStartRequest {
	title?: string;
}

interface MessageRequest {
	role: 'user' | 'assistant';
	content: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const method = request.method;

		// CORS headers - Allow credentials for cookie-based auth
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Cookie, Authorization',
			'Access-Control-Allow-Credentials': 'true',
			'Content-Type': 'application/json',
		};

		// Handle CORS preflight
		if (method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		try {
			// 1️⃣ PUBLIC ROUTES - Auth handler (no guard needed)
			if (url.pathname.startsWith('/api/auth/')) {
				const auth = createAuth(env, request.cf as any); // Type cast needed for Cloudflare Workers
				return auth.handler(request);
			}

			// 2️⃣ PROTECTED ROUTES - Apply auth guard (Better Auth best practice)
			const { error, session, user } = await requireAuth(request, env);
			if (error) {
				return error; // Return 401 if not authenticated
			}

			// At this point, we have a guaranteed authenticated session and user!
			// user.id is validated and secure

			// 3️⃣ CHAT ROUTES - All protected with session

			// POST /chat/start - Create new chat (derive identity from session)
			if (method === 'POST' && url.pathname === '/chat/start') {
				const body: ChatStartRequest = await request.json();
				
				const chatId = crypto.randomUUID();
				const title = body.title || 'New Chat';
				
				// Use user.id from session (secure - no client input needed!)
				await env.applyo.prepare(
					'INSERT INTO chats (id, user_id, title, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
				).bind(chatId, user.id, title).run();

				return new Response(
					JSON.stringify({ 
						chat_id: chatId,
						title,
						created_at: new Date().toISOString()
					}),
					{ 
						headers: {
							...corsHeaders,
							'Cache-Control': 'no-store' // Better Auth recommendation
						}
					}
				);
			}

			// POST /chat/:id/message - Send message and get reply (validate ownership)
			const messageMatch = url.pathname.match(/^\/chat\/([^\/]+)\/message$/);
			if (method === 'POST' && messageMatch) {
				const chatId = messageMatch[1];
				const body: MessageRequest = await request.json();

				if (!body.content || !body.role) {
					return new Response(
						JSON.stringify({ error: 'content and role are required' }),
						{ status: 400, headers: corsHeaders }
					);
				}

				// Defense in depth: Verify chat exists AND belongs to user
				const chat = await env.applyo.prepare(
					'SELECT id FROM chats WHERE id = ? AND user_id = ?'
				).bind(chatId, user.id).first();

				if (!chat) {
					return new Response(
						JSON.stringify({ error: 'Chat not found or access denied' }),
						{ status: 404, headers: corsHeaders }
					);
				}

				// Insert the user's message
				const messageId = crypto.randomUUID();
				await env.applyo.prepare(
					'INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)'
				).bind(messageId, chatId, body.role, body.content).run();

				// If it's a user message, generate an assistant reply
				let assistantMessage = null;
				if (body.role === 'user') {
					const assistantMessageId = crypto.randomUUID();
					const assistantContent = `Echo: ${body.content}`; // TODO: Replace with actual AI logic
					
					await env.applyo.prepare(
						'INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)'
					).bind(assistantMessageId, chatId, 'assistant', assistantContent).run();

					assistantMessage = {
						id: assistantMessageId,
						chat_id: chatId,
						role: 'assistant' as const,
						content: assistantContent,
						created_at: new Date().toISOString()
					};
				}

				return new Response(
					JSON.stringify({
						user_message: {
							id: messageId,
							chat_id: chatId,
							role: body.role,
							content: body.content,
							created_at: new Date().toISOString()
						},
						assistant_message: assistantMessage
					}),
					{ 
						headers: {
							...corsHeaders,
							'Cache-Control': 'no-store'
						}
					}
				);
			}

			// GET /chat/:id - Fetch chat history (validate ownership)
			const chatMatch = url.pathname.match(/^\/chat\/([^\/]+)$/);
			if (method === 'GET' && chatMatch) {
				const chatId = chatMatch[1];

				// Defense in depth: Check ownership in query itself
				const chat = await env.applyo.prepare(
					'SELECT * FROM chats WHERE id = ? AND user_id = ?'
				).bind(chatId, user.id).first();

				if (!chat) {
					return new Response(
						JSON.stringify({ error: 'Chat not found or access denied' }),
						{ status: 404, headers: corsHeaders }
					);
				}

				// Get all messages for this chat
				const messages = await env.applyo.prepare(
					'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC'
				).bind(chatId).all();

				return new Response(
					JSON.stringify({
						chat,
						messages: messages.results
					}),
					{ 
						headers: {
							...corsHeaders,
							'Cache-Control': 'no-store'
						}
					}
				);
			}

			// GET /chats - List all chats for authenticated user (derive from session)
			if (method === 'GET' && url.pathname === '/chats') {
				const page = parseInt(url.searchParams.get('page') || '1');
				const limit = 20;
				const offset = (page - 1) * limit;

				// Use session.user.id - client can't spoof this!
				const countResult = await env.applyo.prepare(
					'SELECT COUNT(*) as count FROM chats WHERE user_id = ?'
				).bind(user.id).first();
				const totalChats = countResult?.count || 0;

				// Get paginated chats
				const chats = await env.applyo.prepare(
					'SELECT * FROM chats WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
				).bind(user.id, limit, offset).all();

				return new Response(
					JSON.stringify({
						chats: chats.results,
						pagination: {
							page,
							limit,
							total: totalChats,
							total_pages: Math.ceil((totalChats as number) / limit)
						}
					}),
					{ 
						headers: {
							...corsHeaders,
							'Cache-Control': 'no-store'
						}
					}
				);
			}

			// DELETE /chat/:id - Delete chat and all messages (validate ownership)
			const deleteMatch = url.pathname.match(/^\/chat\/([^\/]+)$/);
			if (method === 'DELETE' && deleteMatch) {
				const chatId = deleteMatch[1];

				// Defense in depth: Check ownership before deletion
				const chat = await env.applyo.prepare(
					'SELECT id FROM chats WHERE id = ? AND user_id = ?'
				).bind(chatId, user.id).first();

				if (!chat) {
					return new Response(
						JSON.stringify({ error: 'Chat not found or access denied' }),
						{ status: 404, headers: corsHeaders }
					);
				}

				// Delete all messages first (cascade will handle this, but explicit is better)
				await env.applyo.prepare(
					'DELETE FROM messages WHERE chat_id = ?'
				).bind(chatId).run();

				// Delete the chat
				await env.applyo.prepare(
					'DELETE FROM chats WHERE id = ?'
				).bind(chatId).run();

				return new Response(
					JSON.stringify({ 
						success: true,
						message: 'Chat and all messages deleted successfully'
					}),
					{ headers: corsHeaders }
				);
			}

			// Default 404
			return new Response(
				JSON.stringify({ error: 'Not Found' }),
				{ status: 404, headers: corsHeaders }
			);

		} catch (error) {
			console.error('Worker error:', error);
			return new Response(
				JSON.stringify({ 
					error: 'Internal Server Error',
					message: error instanceof Error ? error.message : 'Unknown error'
				}),
				{ status: 500, headers: corsHeaders }
			);
		}
	},
} satisfies ExportedHandler<Env>;
