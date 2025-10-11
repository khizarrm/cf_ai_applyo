# Applyo API Documentation

## 🚀 Quick Start

### Accessing the API Documentation

The Swagger UI documentation is available at the root URL:
- **Local Development**: http://localhost:8787/
- **Production**: https://your-worker.workers.dev/

### Dashboard

The interactive dashboard with authentication is available at:
- **Local**: http://localhost:8787/dashboard
- **Production**: https://your-worker.workers.dev/dashboard

---

## 🔐 Testing Protected Routes

### Method 1: Using Browser Authentication (Recommended)

1. **Login First**
   - Go to `/dashboard` in your browser
   - Click "Login Anonymously" button
   - You're now authenticated with a session cookie

2. **Test Protected Routes**
   - Navigate back to the root `/` for Swagger UI
   - Try any protected endpoint (they'll use your browser cookies automatically)
   - The authentication is handled via cookies, so you don't need to manually add headers

### Method 2: Using Authorization Header

If you want to test with tools like Postman or curl:

1. **Get Session Token**
   - Login via `/dashboard` or call `/api/auth/sign-in/anonymous`
   - Open browser dev tools > Application > Cookies
   - Copy the `better_auth.session_token` cookie value

2. **Use in Swagger UI**
   - Click the 🔒 "Authorize" button at the top of Swagger UI
   - Enter the token in the format: `Bearer YOUR_TOKEN_HERE`
   - Click "Authorize" and close the dialog

3. **Test Protected Routes**
   - All protected routes will now use your authorization header
   - Try endpoints like `/api/protected/profile`

---

## 📚 Available Endpoints

### Public Endpoints (No Authentication Required)

#### `GET /api/public/hello`
- **Description**: Simple hello world endpoint
- **Response**: Returns a greeting message with timestamp

#### `GET /api/public/info`
- **Description**: Get server information
- **Response**: API version, features, and environment details

#### `GET /health`
- **Description**: Health check endpoint
- **Response**: Service status and current timestamp

---

### Protected Endpoints (Authentication Required)

#### `GET /api/protected/profile`
- **Description**: Get authenticated user's profile
- **Response**: User details and session information
- **Requires**: Valid authentication session

#### `POST /api/protected/items`
- **Description**: Create a new item
- **Request Body**:
  ```json
  {
    "name": "My Item",
    "description": "Optional description",
    "category": "Optional category"
  }
  ```
- **Response**: Created item with ID and metadata

#### `GET /api/protected/items`
- **Description**: List all items for the authenticated user
- **Response**: Array of items with metadata

#### `DELETE /api/protected/items/:id`
- **Description**: Delete an item by ID
- **Parameters**: `id` - The item ID to delete
- **Response**: Success confirmation

---

## 🔧 Authentication Routes

### Anonymous Login
```bash
POST /api/auth/sign-in/anonymous
Content-Type: application/json

{}
```

### Get Session
```bash
GET /api/auth/get-session
```

### Sign Out
```bash
POST /api/auth/sign-out
Content-Type: application/json

{}
```

### Geolocation Info
```bash
GET /api/auth/cloudflare/geolocation
```

---

## 💡 Testing Examples

### Using cURL

**Public Endpoint:**
```bash
curl http://localhost:8787/api/public/hello
```

**Protected Endpoint (with cookie):**
```bash
# First login
curl -c cookies.txt -X POST http://localhost:8787/api/auth/sign-in/anonymous \
  -H "Content-Type: application/json" \
  -d '{}'

# Then access protected route
curl -b cookies.txt http://localhost:8787/api/protected/profile
```

**Protected Endpoint (with Bearer token):**
```bash
# Get your token from browser cookies first, then:
curl http://localhost:8787/api/protected/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using JavaScript/Fetch

```javascript
// Login anonymously
const loginResponse = await fetch('/api/auth/sign-in/anonymous', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});

// Access protected route (cookies are sent automatically)
const profileResponse = await fetch('/api/protected/profile', {
  credentials: 'include'
});
const profile = await profileResponse.json();
console.log(profile);

// Create an item
const createResponse = await fetch('/api/protected/items', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My First Item',
    description: 'Testing the API'
  })
});
```

---

## 🎨 Swagger UI Features

- **Try It Out**: Click "Try it out" on any endpoint to test it directly
- **Authorize Button**: Use the 🔒 button at the top to set authentication
- **Request/Response Examples**: Each endpoint shows example data
- **Schema Validation**: All requests are validated against Zod schemas
- **Tags**: Endpoints are organized by "Public" and "Protected" tags

---

## 🔍 Troubleshooting

### 401 Unauthorized Error
- Make sure you're logged in via `/dashboard`
- Check if your session cookie is still valid
- Try logging out and logging back in

### CORS Issues
- Auth routes have CORS enabled for `*` origin (configure for production)
- Make sure you're sending `credentials: 'include'` in fetch requests

### Session Not Found
- Sessions are stored in Cloudflare D1 database
- Anonymous sessions may expire based on configuration
- Clear browser cookies and login again if issues persist

---

## 📝 Development

### Running Locally
```bash
cd applyo-worker
npm run dev
# or
npm start
```

### Deploying
```bash
npm run deploy
```

---

## 🛠️ Stack

- **Framework**: Hono
- **OpenAPI**: Chanfana
- **Validation**: Zod
- **Authentication**: better-auth-cloudflare
- **Database**: Cloudflare D1
- **Storage**: Cloudflare KV
- **Runtime**: Cloudflare Workers

