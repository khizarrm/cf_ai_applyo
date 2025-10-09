const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

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

export async function createChat(userId: string, title?: string): Promise<Chat> {
  const response = await fetch(`${API_URL}/chat/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, title }),
  });
  
  if (!response.ok) throw new Error('Failed to create chat');
  const data = await response.json();
  return {
    id: data.chat_id,
    user_id: data.user_id,
    title: data.title,
    created_at: data.created_at,
  };
}

export async function sendMessage(chatId: string, content: string): Promise<{ user_message: Message; assistant_message: Message | null }> {
  const response = await fetch(`${API_URL}/chat/${chatId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'user', content }),
  });
  
  if (!response.ok) throw new Error('Failed to send message');
  return response.json();
}

export async function getChatHistory(chatId: string): Promise<ChatWithMessages> {
  const response = await fetch(`${API_URL}/chat/${chatId}`);
  if (!response.ok) throw new Error('Failed to get chat history');
  return response.json();
}

export async function listChats(userId: string, page = 1): Promise<{ chats: Chat[]; pagination: any }> {
  const response = await fetch(`${API_URL}/chats?user_id=${userId}&page=${page}`);
  if (!response.ok) throw new Error('Failed to list chats');
  return response.json();
}

export async function deleteChat(chatId: string): Promise<void> {
  const response = await fetch(`${API_URL}/chat/${chatId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete chat');
}

