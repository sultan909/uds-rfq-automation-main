import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { createErrorResponse } from '@/app/api/lib/api-response';

// CSRF token settings
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

interface CSRFTokenData {
  token: string;
  timestamp: number;
  sessionId?: string;
}

// In-memory store for CSRF tokens (use Redis in production)
const csrfTokenStore = new Map<string, CSRFTokenData>();

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(sessionId?: string): string {
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  const timestamp = Date.now();
  
  // Store token with metadata
  csrfTokenStore.set(token, {
    token,
    timestamp,
    sessionId,
  });
  
  // Clean up expired tokens periodically
  if (Math.random() < 0.01) { // 1% chance
    cleanupExpiredTokens();
  }
  
  return token;
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(
  token: string, 
  sessionId?: string,
  maxAge: number = TOKEN_EXPIRY_MS
): boolean {
  if (!token) return false;
  
  const tokenData = csrfTokenStore.get(token);
  if (!tokenData) return false;
  
  // Check if token has expired
  if (Date.now() - tokenData.timestamp > maxAge) {
    csrfTokenStore.delete(token);
    return false;
  }
  
  // Check session binding if provided
  if (sessionId && tokenData.sessionId && tokenData.sessionId !== sessionId) {
    return false;
  }
  
  return true;
}

/**
 * Clean up expired tokens from memory
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [token, data] of csrfTokenStore.entries()) {
    if (now - data.timestamp > TOKEN_EXPIRY_MS) {
      csrfTokenStore.delete(token);
    }
  }
}

/**
 * Extract session ID from request (can be customized based on your auth system)
 */
function getSessionId(request: NextRequest): string | undefined {
  // Try to get from auth token cookie
  const authToken = request.cookies.get('auth_token')?.value;
  if (authToken) {
    // Use a hash of the token as session ID
    return createHash('sha256').update(authToken).digest('hex').slice(0, 16);
  }
  
  // Fallback to IP-based session (less secure)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

/**
 * CSRF protection middleware
 */
export function withCSRFProtection(options: {
  methods?: string[];
  generateTokenForGET?: boolean;
  skipRoutes?: string[];
  customSessionId?: (request: NextRequest) => string | undefined;
} = {}) {
  const {
    methods = ['POST', 'PUT', 'PATCH', 'DELETE'],
    generateTokenForGET = true,
    skipRoutes = [],
    customSessionId,
  } = options;

  return async (request: NextRequest): Promise<NextResponse | null> => {
    const method = request.method;
    const pathname = request.nextUrl.pathname;
    
    // Skip CSRF protection for specified routes
    if (skipRoutes.some(route => pathname.includes(route))) {
      return null;
    }
    
    // Get session ID
    const sessionId = customSessionId ? customSessionId(request) : getSessionId(request);
    
    // For safe methods (GET, HEAD, OPTIONS), generate and return token
    if (!methods.includes(method)) {
      if (generateTokenForGET && method === 'GET') {
        const token = generateCSRFToken(sessionId);
        const response = NextResponse.next();
        
        // Set CSRF token in cookie
        response.cookies.set(CSRF_COOKIE_NAME, token, {
          httpOnly: false, // Allow JavaScript access for sending in headers
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: TOKEN_EXPIRY_MS / 1000,
          path: '/',
        });
        
        return response;
      }
      return null;
    }
    
    // For state-changing methods, validate CSRF token
    const tokenFromHeader = request.headers.get(CSRF_HEADER_NAME);
    const tokenFromCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    
    // Check if token exists in both header and cookie
    if (!tokenFromHeader || !tokenFromCookie) {
      return NextResponse.json(
        createErrorResponse(
          'CSRF token missing. Please refresh the page and try again.',
          {
            code: 'CSRF_TOKEN_MISSING',
            details: {
              headerPresent: !!tokenFromHeader,
              cookiePresent: !!tokenFromCookie,
            }
          }
        ),
        { status: 403 }
      );
    }
    
    // Tokens must match (double-submit cookie pattern)
    if (tokenFromHeader !== tokenFromCookie) {
      return NextResponse.json(
        createErrorResponse(
          'CSRF token mismatch. Please refresh the page and try again.',
          { code: 'CSRF_TOKEN_MISMATCH' }
        ),
        { status: 403 }
      );
    }
    
    // Validate token
    if (!validateCSRFToken(tokenFromHeader, sessionId)) {
      return NextResponse.json(
        createErrorResponse(
          'Invalid or expired CSRF token. Please refresh the page and try again.',
          { code: 'CSRF_TOKEN_INVALID' }
        ),
        { status: 403 }
      );
    }
    
    return null; // Continue to next middleware/handler
  };
}

/**
 * Higher-order function to wrap API handlers with CSRF protection
 */
export function withCSRFProtectedHandler<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  csrfOptions?: Parameters<typeof withCSRFProtection>[0]
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // Apply CSRF protection
    const csrfResponse = await withCSRFProtection(csrfOptions)(request);
    if (csrfResponse) {
      return csrfResponse;
    }

    // Call the original handler
    return handler(request, ...args);
  };
}

/**
 * Generate CSRF token for client-side use
 */
export async function getCSRFToken(request: NextRequest): Promise<string> {
  const sessionId = getSessionId(request);
  return generateCSRFToken(sessionId);
}

/**
 * API endpoint to get CSRF token
 */
export async function handleCSRFTokenRequest(request: NextRequest): Promise<NextResponse> {
  try {
    const token = await getCSRFToken(request);
    
    const response = NextResponse.json({
      success: true,
      data: { token },
      message: 'CSRF token generated successfully'
    });
    
    // Set token in cookie
    response.cookies.set(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: TOKEN_EXPIRY_MS / 1000,
      path: '/',
    });
    
    return response;
  } catch (error) {
    return NextResponse.json(
      createErrorResponse('Failed to generate CSRF token'),
      { status: 500 }
    );
  }
}

/**
 * Preset CSRF protection configurations
 */
export const csrfProtections = {
  // Standard protection for most endpoints
  standard: withCSRFProtection(),
  
  // Strict protection with additional validation
  strict: withCSRFProtection({
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
    generateTokenForGET: true,
  }),
  
  // API-only protection (skips token generation for GET)
  apiOnly: withCSRFProtection({
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
    generateTokenForGET: false,
  }),
  
  // Auth endpoints (skip login/logout)
  auth: withCSRFProtection({
    skipRoutes: ['/api/auth/login', '/api/auth/logout'],
  }),
};

/**
 * Combined auth, rate limiting, and CSRF protection wrapper
 */
export function withFullProtection<T extends any[]>(
  handler: (request: NextRequest, context: any, user: any) => Promise<NextResponse>,
  options: {
    rateLimit?: any;
    roles?: string[];
    csrf?: Parameters<typeof withCSRFProtection>[0];
  } = {}
) {
  return async (request: NextRequest, context: any): Promise<NextResponse> => {
    // Apply CSRF protection first
    if (options.csrf !== false) {
      const csrfResponse = await withCSRFProtection(options.csrf)(request);
      if (csrfResponse) {
        return csrfResponse;
      }
    }

    // Import and apply auth & rate limiting
    const { withAuthAndRateLimit } = await import('./rate-limiter');
    const authHandler = withAuthAndRateLimit(handler, {
      rateLimit: options.rateLimit,
      roles: options.roles,
    });
    
    return authHandler(request, context);
  };
}

/**
 * Get current CSRF protection status
 */
export function getCSRFStatus() {
  return {
    totalTokens: csrfTokenStore.size,
    tokenExpiry: TOKEN_EXPIRY_MS,
    cookieName: CSRF_COOKIE_NAME,
    headerName: CSRF_HEADER_NAME,
  };
}