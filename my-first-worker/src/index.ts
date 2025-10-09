/**
 * Chat API with D1 Database
 * 
 * Endpoints:
 * - POST /chat/start - Create a new chat
 * - POST /chat/:id/message - Send a message and get a reply
 * - GET /chat/:id - Fetch chat history
 * - GET /chats - List all chats for a user (paginated, max 20)
 * - DELETE /chat/:id - Delete chat and all messages
 */

interface ChatStartRequest {
	user_id: string;
	title?: string;
}

interface MessageRequest {
	role: 'user' | 'assistant';
	content: string;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const method = request.method;

		// CORS headers
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Content-Type': 'application/json',
		};

		// Handle CORS preflight
		if (method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		try {
			// POST /chat/start - Create new chat
			if (method === 'POST' && url.pathname === '/chat/start') {
				const body: ChatStartRequest = await request.json();
				
				if (!body.user_id) {
					return new Response(
						JSON.stringify({ error: 'user_id is required' }), 
						{ status: 400, headers: corsHeaders }
					);
				}

				const chatId = crypto.randomUUID();
				const title = body.title || 'New Chat';
				
				await env.applyo.prepare(
					'INSERT INTO chats (id, user_id, title, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
				).bind(chatId, body.user_id, title).run();

				return new Response(
					JSON.stringify({ 
						chat_id: chatId, 
						user_id: body.user_id, 
						title,
						created_at: new Date().toISOString()
					}),
					{ headers: corsHeaders }
				);
			}

			// POST /chat/:id/message - Send message and get reply
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

				// Verify chat exists
				const chat = await env.applyo.prepare(
					'SELECT id FROM chats WHERE id = ?'
				).bind(chatId).first();

				if (!chat) {
					return new Response(
						JSON.stringify({ error: 'Chat not found' }),
						{ status: 404, headers: corsHeaders }
					);
				}

				// Insert the message
				const messageId = crypto.randomUUID();
				await env.applyo.prepare(
					'INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)'
				).bind(messageId, chatId, body.role, body.content).run();

				// If it's a user message, generate an assistant reply
				let assistantMessage = null;
				if (body.role === 'user') {
					const assistantMessageId = crypto.randomUUID();
					const assistantContent = `Echo: ${body.content}`; // Placeholder - replace with actual AI logic
					
					await env.applyo.prepare(
						'INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)'
					).bind(assistantMessageId, chatId, 'assistant', assistantContent).run();

					assistantMessage = {
						id: assistantMessageId,
						chat_id: chatId,
						role: 'assistant',
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
					{ headers: corsHeaders }
				);
			}

			// GET /chat/:id - Fetch chat history
			const chatMatch = url.pathname.match(/^\/chat\/([^\/]+)$/);
			if (method === 'GET' && chatMatch) {
				const chatId = chatMatch[1];

				// Get chat info
				const chat = await env.applyo.prepare(
					'SELECT * FROM chats WHERE id = ?'
				).bind(chatId).first();

				if (!chat) {
					return new Response(
						JSON.stringify({ error: 'Chat not found' }),
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
					{ headers: corsHeaders }
				);
			}

			// GET /chats - List all chats for a user (paginated)
			if (method === 'GET' && url.pathname === '/chats') {
				const userId = url.searchParams.get('user_id');
				const page = parseInt(url.searchParams.get('page') || '1');
				const limit = 20;
				const offset = (page - 1) * limit;

				if (!userId) {
					return new Response(
						JSON.stringify({ error: 'user_id query parameter is required' }),
						{ status: 400, headers: corsHeaders }
					);
				}

				// Get total count
				const countResult = await env.applyo.prepare(
					'SELECT COUNT(*) as count FROM chats WHERE user_id = ?'
				).bind(userId).first();
				const totalChats = countResult?.count || 0;

				// Get paginated chats
				const chats = await env.applyo.prepare(
					'SELECT * FROM chats WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
				).bind(userId, limit, offset).all();

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
					{ headers: corsHeaders }
				);
			}

			// DELETE /chat/:id - Delete chat and all messages
			const deleteMatch = url.pathname.match(/^\/chat\/([^\/]+)$/);
			if (method === 'DELETE' && deleteMatch) {
				const chatId = deleteMatch[1];

				// Verify chat exists
				const chat = await env.applyo.prepare(
					'SELECT id FROM chats WHERE id = ?'
				).bind(chatId).first();

				if (!chat) {
					return new Response(
						JSON.stringify({ error: 'Chat not found' }),
						{ status: 404, headers: corsHeaders }
					);
				}

				// Delete all messages first (due to foreign key constraint)
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
