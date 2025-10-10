'use client';

import { useState, useEffect, useRef } from 'react';
import { AuthGate } from '@/components/auth/auth-gate';
import { authClient } from '@/lib/auth-client';
import { UserMenu } from '@/components/navbar/user-menu';
import { createChat, sendMessage, getChatHistory, listChats, deleteChat, Chat, Message } from '@/lib/api';

export default function Home() {
  const { data: session } = authClient.useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session) return;
    loadChats();
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    try {
      const { chats: chatList } = await listChats();
      setChats(chatList);
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const handleNewChat = async () => {
    try {
      const newChat = await createChat('New Chat');
      setChats([newChat, ...chats]);
      setSelectedChat(newChat.id);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    setSelectedChat(chatId);
    try {
      const { messages: chatMessages } = await getChatHistory(chatId);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedChat || loading) return;

    const userContent = inputMessage;
    setInputMessage('');
    setLoading(true);

    try {
      const { user_message, assistant_message } = await sendMessage(selectedChat, userContent);
      setMessages([...messages, user_message, ...(assistant_message ? [assistant_message] : [])]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('Are you sure you want to delete this chat?')) return;
    
    try {
      await deleteChat(chatId);
      setChats(chats.filter(c => c.id !== chatId));
      if (selectedChat === chatId) {
        setSelectedChat(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  return (
    <AuthGate>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="mb-4">
              <UserMenu />
            </div>
            <button
              onClick={handleNewChat}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              + New Chat
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 flex justify-between items-center ${
                  selectedChat === chat.id ? 'bg-blue-50' : ''
                }`}
              >
                <div onClick={() => handleSelectChat(chat.id)} className="flex-1">
                  <div className="font-medium text-sm truncate">{chat.title}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(chat.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat.id);
                  }}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xl px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="text-sm">{message.content}</div>
                      <div className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {new Date(message.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={loading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={loading || !inputMessage.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    {loading ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <div className="text-xl">Select a chat or create a new one</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
