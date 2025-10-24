# Applyo

**An intelligent cold email automation platform for internship seekers.**

Applyo streamlines the internship search process by automatically finding relevant companies and reaching out to founders and key personnel on behalf of users.

> 🚧 **Status:** Work in Progress — This project is being developed as part of a Cloudflare internship application.

## 📐 Backend Architecture Diagram

![Backend Architecture](./backend.png)

The backend is built with Cloudflare Workers and follows a clean, modular architecture with endpoints organized by domain.

## 🏗️ Architecture

Full-stack application with:

- **`frontend/`** - Next.js 15 frontend with Cloudflare deployment
- **`applyo-worker/`** - Cloudflare Workers backend with intelligent agents

Key infrastructure:
- ⚡ **Cloudflare Workers** - Serverless API backend
- 🗄️ **Database** - SQLite with Drizzle ORM
- 🌐 **Cloudflare Workers** - Frontend hosting via OpenNext
- 🔐 **Better Auth** - Authentication system
- 🤖 **AI Agents** - Intelligent automation agents

## ✨ Features (Planned & In Progress)

### Current Features
- 🔐 **Authentication** - Email/password and anonymous sign-in with Better Auth
- 👤 **User Management** - Secure session management and user profiles
- 🤖 **AI Agents** - Orchestrator, Profiler, Prospector, and Outreach agents
- 🗄️ **Database** - SQLite with Drizzle ORM for type-safe queries
- 🎨 **Modern UI** - Tailwind CSS and Radix UI components
- 📁 **Resume Upload** - PDF resume processing and analysis

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
   cd applyo-worker
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
   cd frontend
   pnpm install
   
   # Create .env.local file (or copy from .env.example)
   cp .env.example .env.local
   
   # Start the development server
   pnpm dev
   ```

4. **Access the application:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend: [http://localhost:8787](http://localhost:8787)

## 📦 Project Structure

```
applyo/
├── frontend/              # Next.js frontend application
│   ├── src/               # Source code
│   │   ├── app/          # Next.js app directory
│   │   │   ├── layout.tsx     # Root layout
│   │   │   ├── page.tsx       # Landing page
│   │   │   ├── login/         # Login page
│   │   │   ├── signup/        # Signup page
│   │   │   └── dashboard/     # Dashboard page
│   │   └── components/    # React components
│   │       ├── LoginForm.tsx     # Login form
│   │       ├── SignupForm.tsx    # Signup form
│   │       ├── ResumeUpload.tsx  # Resume upload
│   │       └── ui/               # Reusable UI components
│   ├── lib/               # Utilities and API client
│   │   ├── api.ts         # API client with all endpoints
│   │   ├── auth-client.ts # Better Auth client
│   │   └── utils.ts       # Helper functions
│   ├── wrangler.toml      # Cloudflare deployment config
│   ├── open-next.config.ts # OpenNext adapter config
│   └── .env.example       # Environment variables template
│
└── applyo-worker/         # Cloudflare Worker backend
    ├── src/
    │   ├── agents/        # AI automation agents
    │   │   ├── orchestrator.ts  # Main orchestration agent
    │   │   ├── profiler.ts      # User profiling agent
    │   │   ├── prospector.ts    # Company discovery agent
    │   │   └── outreach.ts      # Email outreach agent
    │   ├── auth/          # Better Auth configuration
    │   ├── db/            # Database schemas and config
    │   ├── endpoints/     # API endpoint handlers
    │   ├── lib/           # Utilities and tools
    │   └── index.ts       # Main worker entry point
    ├── drizzle/           # Database migrations
    └── wrangler.toml      # Worker configuration
```

## 🔧 Backend Configuration

### Environment Variables

Create a `.dev.vars` file in `applyo-worker/`:

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
- `POST /api/auth/sign-in/email` - Email/password sign in
- `POST /api/auth/sign-in/anonymous` - Anonymous sign in
- `POST /api/auth/sign-up/email` - User registration
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/get-session` - Get current session
- `GET /api/auth/cloudflare/geolocation` - Get user geolocation

#### Public API
- `GET /api/public/hello` - Public hello message
- `GET /api/public/info` - Server information

#### Protected API (requires authentication)
- `GET /api/protected/profile` - Get user profile
- `POST /api/protected/items` - Create new item
- `GET /api/protected/items` - List all items
- `DELETE /api/protected/items/:id` - Delete item

#### AI Agents
- `POST /api/agents/prospects` - Query prospects agent

#### Coming Soon
- `GET /companies` - Search and discover relevant companies
- `POST /campaigns` - Create automated outreach campaigns
- `GET /campaigns/:id/analytics` - View campaign performance metrics
- `POST /contacts/discover` - Find target contacts at companies
- `POST /emails/generate` - AI-generated personalized email content
- `POST /emails/send` - Send cold emails with tracking

## 🎨 Frontend Configuration

### Environment Variables

Create a `.env.local` file in `frontend/` (or copy from `.env.example`):

```env
# Development
NEXT_PUBLIC_API_URL=http://localhost:8787

# Production
# NEXT_PUBLIC_API_URL=https://applyo-worker.applyo.workers.dev
```

### Frontend Features

- **Framework:** Next.js 15 with App Router and Turbopack
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4
- **Components:** Radix UI components and custom UI elements
- **Authentication:** Better Auth client with email/anonymous sign-in
- **Icons:** Lucide React
- **PDF Processing:** PDF.js for resume analysis
- **Deployment:** Cloudflare Workers with OpenNext adapter

The frontend includes authentication flows, resume upload functionality, and a clean dashboard interface.

## 🚢 Deployment

### Deploy Backend (Cloudflare Worker)

1. **Set up D1 database:**
   ```bash
   cd applyo-worker
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

### Deploy Frontend (Cloudflare Workers with OpenNext)

The frontend is now configured to deploy to Cloudflare Workers using the OpenNext adapter:

**Option 1: Command Line**
```bash
cd frontend
pnpm run deploy
```

**Option 2: Preview locally with Cloudflare runtime**
```bash
cd frontend
pnpm run preview
```

**Environment Variables for Production:**
Set in Cloudflare dashboard or via Wrangler:
```bash
wrangler secret put NEXT_PUBLIC_API_URL
# Enter: https://applyo-worker.applyo.workers.dev
```

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
cd applyo-worker
npm test
```

## 📝 Development Scripts

### Backend (applyo-worker)
- `npm run dev` - Start development server
- `npm run deploy` - Deploy to Cloudflare
- `npm test` - Run tests
- `npm run db:generate` - Generate migrations
- `npm run db:studio` - Open Drizzle Studio

### Frontend (frontend)
- `pnpm dev` - Start development server
- `pnpm build` - Build for production  
- `pnpm start` - Start production server
- `pnpm preview` - Preview with Cloudflare runtime
- `pnpm deploy` - Build and deploy to Cloudflare Workers
- `pnpm cf-typegen` - Generate Cloudflare environment types

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** with Turbopack
- **React 19**
- **Better Auth** - Client-side authentication 
- **TypeScript**
- **Tailwind CSS 4**
- **Radix UI Components**
- **Lucide React Icons**
- **PDF.js** - PDF processing
- **OpenNext Adapter** - Cloudflare Workers deployment

### Backend
- **Cloudflare Workers** - Serverless API
- **SQLite Database** - With Drizzle ORM
- **Better Auth** - Authentication system
- **AI Agents** - Intelligent automation
- **TypeScript**
- **Hono Framework**
- **Wrangler CLI**

### Deployment
- **Cloudflare Workers** (both frontend and backend)
- **OpenNext** - Next.js to Workers adapter

## 📚 Additional Documentation

- [Frontend README](./frontend/README.md)
- [Backend README](./applyo-worker/README.md)
- [API Documentation](./API_DOCUMENTATION.md)

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

