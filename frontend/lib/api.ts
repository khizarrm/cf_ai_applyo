/**
 * API Client for Applyo Frontend
 * Handles authentication and API requests to the backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://applyo-worker.applyo.workers.dev';

/**
 * Base fetch wrapper with credentials handling
 */
async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log("fetching: ", url)

  const defaultOptions: RequestInit = {
    credentials: 'include', 
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  console.log("getting response with: ", defaultOptions)
  const response = await fetch(url, { ...defaultOptions, ...options });
  console.log("Response: ", response)
  return response;
}

// ============= AUTH API =============

/**
 * Authentication API
 */
export const auth = {
  /**
   * Login anonymously (creates a new anonymous user session)
   */
  loginAnonymously: async () => {
    const response = await apiFetch('/api/auth/sign-in/anonymous', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Anonymous login failed');
    }

    return response.json();
  },

  /**
   * Sign up with email and password
   */
  signUp: async (email: string, password: string, name?: string) => {
    const response = await apiFetch('/api/auth/sign-up/email', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Sign up failed');
    }

    return response.json();
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string) => {
    const response = await apiFetch('/api/auth/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Sign in failed');
    }

    return response.json();
  },

  /**
   * Sign out (clears session)
   */
  signOut: async () => {
    const response = await apiFetch('/api/auth/sign-out', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error('Sign out failed');
    }

    return response.json();
  },

  /**
   * Get current session
   */
  getSession: async () => {
    const response = await apiFetch('/api/auth/get-session');

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data?.session ? data : null;
  },

  /**
   * Get geolocation data
   */
  getGeolocation: async () => {
    const response = await apiFetch('/api/auth/cloudflare/geolocation');

    if (!response.ok) {
      return null;
    }

    return response.json();
  },
};

// ============= PUBLIC API =============

/**
 * Public API endpoints
 */
export const publicApi = {
  /**
   * Get public hello message
   */
  hello: async () => {
    const response = await apiFetch('/api/public/hello');
    return response.json();
  },

  /**
   * Get server info
   */
  info: async () => {
    const response = await apiFetch('/api/public/info');
    return response.json();
  },
};

// ============= PROTECTED API =============

/**
 * Protected API endpoints (require authentication)
 */
export const protectedApi = {
  /**
   * Get user profile
   */
  getProfile: async () => {
    const response = await apiFetch('/api/protected/profile');

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return response.json();
  },

  /**
   * Create a new item
   */
  createItem: async (data: {
    name: string;
    description?: string;
    category?: string;
  }) => {
    const response = await apiFetch('/api/protected/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create item');
    }

    return response.json();
  },

  /**
   * List all items
   */
  listItems: async () => {
    const response = await apiFetch('/api/protected/items');

    if (!response.ok) {
      throw new Error('Failed to fetch items');
    }

    return response.json();
  },

  /**
   * Delete an item by ID
   */
  deleteItem: async (id: string) => {
    const response = await apiFetch(`/api/protected/items/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete item');
    }

    return response.json();
  },
};

// ============= AGENTS API =============

/**
 * Agents API endpoints
 */
export const agentsApi = {
  /**
   * Call prospects agent
   */
  prospects: async (query: string) => {
    const response = await apiFetch('/api/agents/prospects', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error('Failed to call prospects agent');
    }

    return response.json();
  },
};

// ============= TYPES =============

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  createdAt: string;
}

export interface Session {
  id: string;
  expiresAt: string;
}

export interface AuthResponse {
  user: User;
  session: Session;
}

export interface GeolocationData {
  timezone?: string;
  city?: string;
  country?: string;
  region?: string;
  regionCode?: string;
  colo?: string;
  latitude?: string;
  longitude?: string;
}
