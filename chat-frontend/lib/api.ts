export const API_URL = 'https://my-first-worker.applyo.workers.dev'
  // process.env.NEXT_PUBLIC_API_URL ||
  // (process.env.NODE_ENV === 'development'
  //   ? 'http://localhost:8787'
  //   : 'https://my-first-worker-production.applyo.workers.dev');

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatWithMessages {
  chat: Chat;
  messages: Message[];
}

export async function fetchJson(input: RequestInfo | URL, init: RequestInit = {}) {
  const response = await fetch(input, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Request failed');
  }

  return response.json();
}

export async function createChat(title?: string): Promise<Chat> {
  const data = await fetchJson(`${API_URL}/chat/start`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  return {
    id: data.chat_id,
    user_id: data.user_id,
    title: data.title,
    created_at: data.created_at,
  };
}

export async function sendMessage(chatId: string, content: string): Promise<{ user_message: Message; assistant_message: Message | null }> {
  return fetchJson(`${API_URL}/chat/${chatId}/message`, {
    method: 'POST',
    body: JSON.stringify({ role: 'user', content }),
  });
}

export async function getChatHistory(chatId: string): Promise<ChatWithMessages> {
  return fetchJson(`${API_URL}/chat/${chatId}`);
}

export async function listChats(page = 1): Promise<{ chats: Chat[]; pagination: any }> {
  return fetchJson(`${API_URL}/chats?page=${page}`);
}

export async function deleteChat(chatId: string): Promise<void> {
  await fetchJson(`${API_URL}/chat/${chatId}`, {
    method: 'DELETE',
  });
}

export async function getSession() {
  return fetchJson(`${API_URL}/api/auth/session`, {
    method: 'GET',
  });
}

