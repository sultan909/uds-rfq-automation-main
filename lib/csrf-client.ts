/**
 * Client-side CSRF token management
 */

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Get CSRF token from cookie
 */
export function getCSRFTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Fetch CSRF token from server
 */
export async function fetchCSRFToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/csrf-token', {
      method: 'GET',
      credentials: 'same-origin',
    });
    
    if (!response.ok) {
      console.error('Failed to fetch CSRF token:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data.data?.token || null;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return null;
  }
}

/**
 * Get CSRF token, fetching from server if not available in cookie
 */
export async function getCSRFToken(): Promise<string | null> {
  // First try to get from cookie
  let token = getCSRFTokenFromCookie();
  
  // If not available, fetch from server
  if (!token) {
    token = await fetchCSRFToken();
  }
  
  return token;
}

/**
 * Add CSRF token to request headers
 */
export async function addCSRFHeaders(headers: HeadersInit = {}): Promise<HeadersInit> {
  const token = await getCSRFToken();
  
  if (token) {
    return {
      ...headers,
      [CSRF_HEADER_NAME]: token,
    };
  }
  
  return headers;
}

/**
 * Enhanced fetch function with automatic CSRF token handling
 */
export async function csrfFetch(
  url: string | URL | Request,
  options: RequestInit = {}
): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET';
  const needsCSRF = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  
  if (needsCSRF) {
    // Add CSRF token to headers
    options.headers = await addCSRFHeaders(options.headers);
  }
  
  // Ensure credentials are included for cookie handling
  options.credentials = options.credentials || 'same-origin';
  
  const response = await fetch(url, options);
  
  // If CSRF token is invalid, try to refresh and retry once
  if (response.status === 403 && needsCSRF) {
    const errorData = await response.json().catch(() => ({}));
    if (errorData.error?.code?.includes('CSRF')) {
      console.warn('CSRF token invalid, refreshing...');
      
      // Fetch new token
      const newToken = await fetchCSRFToken();
      if (newToken) {
        // Retry with new token
        options.headers = await addCSRFHeaders(
          // Remove old CSRF header if it exists
          Object.fromEntries(
            Object.entries(options.headers || {}).filter(
              ([key]) => key.toLowerCase() !== CSRF_HEADER_NAME
            )
          )
        );
        
        return fetch(url, options);
      }
    }
  }
  
  return response;
}

/**
 * Hook for React components to manage CSRF tokens
 */
export function useCSRFToken() {
  if (typeof window === 'undefined') {
    return {
      token: null,
      refreshToken: async () => null,
      isReady: false,
    };
  }

  const [token, setToken] = React.useState<string | null>(null);
  const [isReady, setIsReady] = React.useState(false);

  const refreshToken = React.useCallback(async () => {
    const newToken = await fetchCSRFToken();
    setToken(newToken);
    return newToken;
  }, []);

  React.useEffect(() => {
    // Initialize token
    const initToken = async () => {
      const currentToken = await getCSRFToken();
      setToken(currentToken);
      setIsReady(true);
    };
    
    initToken();
  }, []);

  return {
    token,
    refreshToken,
    isReady,
  };
}

// Import React only if it's available (for the hook)
let React: any;
try {
  React = require('react');
} catch {
  // React not available, hook won't work but other functions will
}

/**
 * Middleware for axios or other HTTP clients
 */
export const csrfInterceptor = {
  request: async (config: any) => {
    const method = config.method?.toUpperCase() || 'GET';
    const needsCSRF = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    
    if (needsCSRF) {
      const token = await getCSRFToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers[CSRF_HEADER_NAME] = token;
      }
    }
    
    return config;
  },
  
  responseError: async (error: any) => {
    if (error.response?.status === 403) {
      const errorData = error.response?.data;
      if (errorData?.error?.code?.includes('CSRF')) {
        // Try to refresh token
        await fetchCSRFToken();
        // Note: You might want to retry the request here
      }
    }
    return Promise.reject(error);
  },
};