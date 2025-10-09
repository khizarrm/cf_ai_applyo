# Applyo Chat Frontend

A simple, clean chat interface built with Next.js, React, and Tailwind CSS.

## Features

- 💬 Create and manage multiple chats
- 📝 Send and receive messages
- 🗑️ Delete chats
- 📱 Responsive design
- 🎨 Modern UI with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 20+ (required for the backend)
- pnpm

### Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create a `.env.local` file (or copy from `.env.example`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```

3. Start the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Running with the Backend

Make sure your Cloudflare Worker is running locally:

```bash
cd ../my-first-worker
npm run dev
```

The worker should be running on `http://localhost:8787`.

## Deploying to Cloudflare Pages

1. Build the project:
```bash
pnpm build
```

2. Deploy to Cloudflare Pages:
```bash
npx wrangler pages deploy out
```

Or connect your Git repository to Cloudflare Pages for automatic deployments.

### Build Settings for Cloudflare Pages

- **Build command**: `pnpm build`
- **Build output directory**: `out`
- **Environment variables**: 
  - `NEXT_PUBLIC_API_URL`: Your deployed worker URL (e.g., `https://my-first-worker.your-subdomain.workers.dev`)

## Project Structure

```
chat-frontend/
├── app/
│   ├── layout.tsx    # Root layout with metadata
│   ├── page.tsx      # Main chat interface
│   └── globals.css   # Global styles
├── lib/
│   └── api.ts        # API client for chat endpoints
└── .env.local        # Environment variables
```

## API Endpoints Used

- `POST /chat/start` - Create a new chat
- `POST /chat/:id/message` - Send a message
- `GET /chat/:id` - Get chat history
- `GET /chats` - List all chats
- `DELETE /chat/:id` - Delete a chat
