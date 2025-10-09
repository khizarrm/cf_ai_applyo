# Deployment Guide

## Deploy to Cloudflare Pages

### Option 1: Using Wrangler CLI (Quick Deploy)

1. Make sure you have the API URL for your deployed worker. First deploy your worker:
```bash
cd ../my-first-worker
npm run deploy
```

2. Note the worker URL (e.g., `https://my-first-worker.your-subdomain.workers.dev`)

3. Update `.env.local` with your production API URL:
```env
NEXT_PUBLIC_API_URL=https://my-first-worker.your-subdomain.workers.dev
```

4. Build and deploy:
```bash
pnpm deploy
```

Or manually:
```bash
pnpm build
npx wrangler pages deploy out --project-name=applyo-chat
```

### Option 2: Using Cloudflare Dashboard (Git Integration)

1. Push your code to GitHub/GitLab
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
3. Navigate to **Workers & Pages** → **Create Application** → **Pages** → **Connect to Git**
4. Select your repository
5. Configure build settings:
   - **Framework preset**: Next.js
   - **Build command**: `pnpm build`
   - **Build output directory**: `out`
   - **Root directory**: `/chat-frontend` (if in monorepo)
6. Add environment variable:
   - **Variable name**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your deployed worker URL
7. Click **Save and Deploy**

## Update API URL After Deployment

After deploying, you may need to update the worker's CORS settings if the frontend domain is different from localhost.

In your worker code (`my-first-worker/src/index.ts`), update the CORS origin:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://applyo-chat.pages.dev', // Your Pages URL
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};
```

Or use `*` for all origins (less secure):
```typescript
'Access-Control-Allow-Origin': '*'
```

## Testing Your Deployment

1. Visit your Pages URL (e.g., `https://applyo-chat.pages.dev`)
2. Click "New Chat" to create a chat
3. Send a message and verify the response
4. Test all CRUD operations

## Troubleshooting

### CORS Errors
- Make sure your worker's CORS headers include your Pages domain
- Check that the API URL in `.env.local` is correct

### API Not Found
- Verify the worker is deployed and running
- Check the worker URL is correct in environment variables
- Make sure the D1 database schema is applied to the remote database:
  ```bash
  cd ../my-first-worker
  npx wrangler d1 execute applyo --remote --file=schema.sql
  ```

### Build Errors
- Clear the `.next` directory: `rm -rf .next`
- Reinstall dependencies: `pnpm install`
- Try building again: `pnpm build`

