# Applyo

**An intelligent cold email automation platform for internship seekers.**

Applyo streamlines the internship search process by automatically finding relevant companies and reaching out to founders and key personnel on behalf of users.

> 🚧 **Status:** Work in Progress — This project is being developed as part of a Cloudflare internship application.

## 🏗️ Architecture

Full-stack application with:

- **`chat-frontend/`** - Next.js 15 frontend with Vercel AI SDK components
- **`my-first-worker/`** - Cloudflare Workers backend with D1 database

Key infrastructure:
- ⚡ **Cloudflare Workers** - Serverless API backend
- 🗄️ **D1 Database** - SQLite at the edge with Drizzle ORM
- 🌐 **Cloudflare Pages** - Frontend hosting
- 🔐 **Better Auth** - Google OAuth authentication
- 🤖 **Vercel AI SDK** - AI-powered UI elements and streaming

## ✨ Features (Planned & In Progress)

### Current Features
- 🔐 **Google Sign-In** - One-click authentication with Better Auth
- 👤 **User Management** - Secure session management and user profiles
- 💬 **AI Chat Interface** - Built with Vercel AI SDK for streaming responses
- 🗄️ **Database** - D1 (SQLite) with Drizzle ORM for type-safe queries
- 🎨 **Modern UI** - Tailwind CSS and Radix UI components

### Upcoming Features
- 🏢 **Company Discovery** - AI-powered company matching based on user preferences
- 📧 **Automated Outreach** - Personalized cold email generation and sending
- 🎯 **Target Identification** - Find founders and decision-makers at target companies
- 📊 **Campaign Analytics** - Track email opens, responses, and conversion rates
- 🤖 **AI Email Personalization** - Generate contextual, personalized outreach emails
- 📅 **Follow-up Automation** - Smart follow-up scheduling and management

## 🎯 How It Works (Planned Flow)

1. **User Onboarding** - Users sign up, set their profile, skills, and internship preferences
2. **Company Discovery** - AI matches users with relevant companies based on industry, size, and culture fit
3. **Contact Identification** - System finds founders, hiring managers, and relevant contacts at target companies
4. **Email Generation** - AI creates personalized, contextual cold emails tailored to each recipient
5. **Automated Sending** - Emails are sent on behalf of users with tracking and analytics
6. **Response Management** - Track replies, schedule follow-ups, and manage conversations
7. **Success Metrics** - Monitor open rates, response rates, and interview conversions

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Cloudflare account (for deployment)
- Wrangler CLI (`npm install -g wrangler`)

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd applyo
   ```

2. **Set up the backend:**
   ```bash
   cd my-first-worker
   npm install
   
   # Create .dev.vars file with required secrets
   cp .dev.vars.example .dev.vars
   # Edit .dev.vars with your credentials
   
   # Run database migrations
   npm run db:migrate:local
   
   # Start the development server
   npm run dev
   ```

3. **Set up the frontend (in a new terminal):**
   ```bash
   cd chat-frontend
   pnpm install
   
   # Create .env.local file
   echo "NEXT_PUBLIC_API_URL=http://localhost:8787" > .env.local
   
   # Start the development server
   pnpm dev
   ```

4. **Access the application:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend: [http://localhost:8787](http://localhost:8787)

## 📦 Project Structure

```
applyo/
├── chat-frontend/           # Next.js frontend application
│   ├── app/                # Next.js app directory
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Main chat interface
│   │   └── globals.css    # Global styles
│   ├── components/        # React components
│   │   ├── ai-elements/   # Chat UI components
│   │   ├── auth/          # Authentication components
│   │   ├── navbar/        # Navigation components
│   │   └── ui/            # Reusable UI components
│   └── lib/               # Utilities and API client
│       ├── api.ts         # Chat API client
│       ├── auth-client.ts # Better Auth client
│       └── utils.ts       # Helper functions
│
└── my-first-worker/        # Cloudflare Worker backend
    ├── src/
    │   ├── auth/          # Better Auth configuration
    │   ├── db/            # Database schemas and config
    │   ├── middleware/    # Auth middleware
    │   └── index.ts       # Main worker entry point
    ├── drizzle/           # Database migrations
    └── wrangler.toml      # Worker configuration
```

## 🔧 Backend Configuration

### Environment Variables

Create a `.dev.vars` file in `my-first-worker/`:

```env
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:8787
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
BASE_URL=http://localhost:8787
FRONTEND_URL=http://localhost:3000
```

### Database Setup

The backend uses Cloudflare D1 (SQLite) with Drizzle ORM:

```bash
# Generate new migrations after schema changes
npm run db:generate

# Apply migrations locally
npm run db:migrate:local

# Apply migrations to production
npm run db:migrate:remote

# Open Drizzle Studio (database GUI)
npm run db:studio

# Push schema directly (for development)
npm run db:push:local
```

### API Endpoints

#### Authentication
- `POST /api/auth/sign-in` - Email/password sign in
- `POST /api/auth/sign-up` - User registration
- `GET /api/auth/callback/google` - Google OAuth callback
- `POST /api/auth/sign-out` - Sign out

#### Currently Implemented (Protected)
- `POST /chat/start` - Create a new conversation/campaign
- `POST /chat/:id/message` - Send messages and interact
- `GET /chat/:id` - Get conversation/campaign history
- `GET /chats` - List all conversations/campaigns (paginated)
- `DELETE /chat/:id` - Delete a conversation/campaign

#### Coming Soon
- `GET /companies` - Search and discover relevant companies
- `POST /campaigns` - Create automated outreach campaigns
- `GET /campaigns/:id/analytics` - View campaign performance metrics
- `POST /contacts/discover` - Find target contacts at companies
- `POST /emails/generate` - AI-generated personalized email content
- `POST /emails/send` - Send cold emails with tracking

## 🎨 Frontend Configuration

### Environment Variables

Create a `.env.local` file in `chat-frontend/`:

```env
# Development
NEXT_PUBLIC_API_URL=http://localhost:8787

# Production
# NEXT_PUBLIC_API_URL=https://my-first-worker.your-subdomain.workers.dev
```

### Frontend Features

- **Framework:** Next.js 15 with App Router and Turbopack
- **UI Library:** React 19
- **AI Components:** Vercel AI SDK for chat interface and streaming
- **Styling:** Tailwind CSS 4
- **Components:** Radix UI (Avatar, Dropdown, Tooltip, etc.)
- **Authentication:** Better Auth client with Google sign-in
- **Icons:** Lucide React
- **Code Highlighting:** React Syntax Highlighter
- **Flow Diagrams:** XYFlow React

The chat interface uses Vercel AI SDK's streaming components for real-time AI responses.

## 🚢 Deployment

### Deploy Backend (Cloudflare Worker)

1. **Set up D1 database:**
   ```bash
   cd my-first-worker
   wrangler d1 create applyo
   # Update database_id in wrangler.toml
   ```

2. **Set production secrets:**
   ```bash
   wrangler secret put BETTER_AUTH_SECRET
   wrangler secret put GOOGLE_CLIENT_SECRET
   ```

3. **Run migrations:**
   ```bash
   npm run db:migrate:remote
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```

### Deploy Frontend (Cloudflare Pages)

**Option 1: Command Line**
```bash
cd chat-frontend
pnpm build
npx wrangler pages deploy out --project-name=applyo-chat
```

**Option 2: Git Integration**
1. Connect your repository to Cloudflare Pages
2. Configure build settings:
   - **Build command:** `cd chat-frontend && pnpm install && pnpm build`
   - **Build output directory:** `chat-frontend/out`
   - **Root directory:** `/`
   - **Environment variables:**
     - `NEXT_PUBLIC_API_URL`: Your worker URL

## 🔐 Authentication Setup

Uses **Better Auth** with Google OAuth for simple, secure sign-in.

### Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - Development: `http://localhost:8787/api/auth/callback/google`
   - Production: `https://your-worker.workers.dev/api/auth/callback/google`
6. Copy the Client ID and Client Secret
7. Set `GOOGLE_CLIENT_ID` in `wrangler.toml`
8. Set `GOOGLE_CLIENT_SECRET` using `wrangler secret put`

Better Auth handles session management, cookies, and user data automatically.

## 🧪 Testing

### Backend Tests
```bash
cd my-first-worker
npm test
```

## 📝 Development Scripts

### Backend (my-first-worker)
- `npm run dev` - Start development server
- `npm run deploy` - Deploy to Cloudflare
- `npm test` - Run tests
- `npm run db:generate` - Generate migrations
- `npm run db:studio` - Open Drizzle Studio

### Frontend (chat-frontend)
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm deploy` - Build and deploy to Cloudflare Pages

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** with Turbopack
- **React 19**
- **Vercel AI SDK** - AI chat components and streaming
- **Better Auth** - Client-side authentication with Google OAuth
- TypeScript
- Tailwind CSS 4
- Radix UI Components
- XYFlow for visualizations
- React Syntax Highlighter

### Backend
- **Cloudflare Workers** - Serverless API
- **D1 Database** - SQLite with Drizzle ORM
- **Better Auth** - Authentication with Cloudflare adapter
- TypeScript
- Vitest for testing
- Wrangler CLI

### Deployment
- Cloudflare Pages (frontend)
- Cloudflare Workers (backend)

## 📚 Additional Documentation

- [Frontend README](./chat-frontend/README.md)
- [Frontend Deployment Guide](./chat-frontend/DEPLOYMENT.md)
- [Backend Development Guide](./my-first-worker/CLAUDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🎯 Project Goals

This project demonstrates:

1. **Full-Stack Development** - Building a complete application from database to UI
2. **Modern Web Standards** - TypeScript, serverless architecture, edge computing
3. **Authentication & Security** - OAuth implementation with Better Auth
4. **AI Integration** - Using Vercel AI SDK for intelligent features
5. **Real-World Problem Solving** - Addressing the challenge of finding internships at scale

> **Note:** This project is being developed as part of a Cloudflare internship application.

## 📄 License

This project is private and proprietary.

## 🐛 Troubleshooting

### Common Issues

**CORS Errors:**
- Ensure `FRONTEND_URL` is correctly set in `wrangler.toml`
- Check that the frontend URL matches the allowed origins

**Database Connection Issues:**
- Verify D1 database is created and ID matches `wrangler.toml`
- Run migrations: `npm run db:migrate:local` or `npm run db:migrate:remote`

**Authentication Not Working:**
- Verify all secrets are set: `wrangler secret list`
- Check Google OAuth credentials and redirect URIs
- Ensure `BETTER_AUTH_SECRET` is set (generate with `openssl rand -base64 32`)

**Build Errors:**
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && pnpm install`

## 🤖 AI-Assisted Development

This project was developed with AI assistance. Key prompts and problem-solving approaches are documented in [`PROMPTS.md`](./PROMPTS.md) for transparency and educational purposes.

All work is original - AI was used as a development tool, not for copying solutions.

## 📞 Support

For issues and questions, please open an issue in the repository.

---

Built with Next.js, Cloudflare Workers, Better Auth, and Vercel AI SDK.

