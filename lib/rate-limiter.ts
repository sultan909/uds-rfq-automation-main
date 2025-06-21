import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/app/api/lib/api-response';

// In-memory store for rate limiting (use Redis in production)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  onLimitReached?: (request: NextRequest, key: string) => void; // Callback when limit is reached
}

// Default configurations for different endpoint types
export const RATE_LIMIT_CONFIGS = {
  // Very strict for auth endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  // Moderate for general API endpoints
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
  },
  // Strict for data modification endpoints
  WRITE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
  // More lenient for read endpoints
  READ: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  // Very strict for expensive operations
  EXPENSIVE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  },
} as const;

/**
 * Default key generator - uses IP address
 */
function defaultKeyGenerator(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  return `rate_limit:${ip}`;
}

/**
 * User-based key generator (requires authentication)
 */
export function userBasedKeyGenerator(request: NextRequest): string {
  // Try to get user ID from auth token
  const authToken = request.cookies.get('auth_token')?.value;
  if (authToken) {
    // In a real implementation, decode the JWT to get user ID
    // For now, use the token as part of the key
    return `rate_limit:user:${authToken.slice(-10)}`;
  }
  return defaultKeyGenerator(request);
}

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; limit: number; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) { // 1% chance to cleanup
    cleanupExpiredEntries();
  }

  // If no entry exists or it's expired, create a new one
  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    
    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Check if limit is exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Cleanup expired entries from the store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limiting middleware for API routes
 */
export function withRateLimit(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const keyGenerator = config.keyGenerator || defaultKeyGenerator;
    const key = keyGenerator(request);
    
    const result = checkRateLimit(key, config);
    
    if (!result.allowed) {
      // Call callback if provided
      if (config.onLimitReached) {
        config.onLimitReached(request, key);
      }

      // Return rate limit error response
      const resetTimeSeconds = Math.ceil((result.resetTime - Date.now()) / 1000);
      
      return NextResponse.json(
        createErrorResponse(
          'Too many requests. Please try again later.',
          {
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: resetTimeSeconds,
          }
        ),
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': resetTimeSeconds.toString(),
          },
        }
      );
    }

    // Add rate limit headers to response (will be added later)
    return null; // Continue to next middleware/handler
  };
}

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function withRateLimitedHandler<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // Apply rate limiting
    const rateLimitResponse = await withRateLimit(config)(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Call the original handler
    const response = await handler(request, ...args);

    // Add rate limit headers to successful responses
    const key = (config.keyGenerator || defaultKeyGenerator)(request);
    const entry = rateLimitStore.get(key);
    
    if (entry) {
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', (config.maxRequests - entry.count).toString());
      response.headers.set('X-RateLimit-Reset', entry.resetTime.toString());
    }

    return response;
  };
}

/**
 * Preset rate limiters for common use cases
 */
export const rateLimiters = {
  auth: withRateLimit(RATE_LIMIT_CONFIGS.AUTH),
  api: withRateLimit(RATE_LIMIT_CONFIGS.API),
  write: withRateLimit(RATE_LIMIT_CONFIGS.WRITE),
  read: withRateLimit(RATE_LIMIT_CONFIGS.READ),
  expensive: withRateLimit(RATE_LIMIT_CONFIGS.EXPENSIVE),
};

/**
 * Combined auth and rate limiting wrapper
 */
export function withAuthAndRateLimit<T extends any[]>(
  handler: (request: NextRequest, context: any, user: any) => Promise<NextResponse>,
  options: {
    rateLimit?: RateLimitConfig;
    roles?: string[];
  } = {}
) {
  return async (request: NextRequest, context: any): Promise<NextResponse> => {
    // Apply rate limiting first
    if (options.rateLimit) {
      const rateLimitResponse = await withRateLimit(options.rateLimit)(request);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
    }

    // Import auth middleware dynamically to avoid circular dependencies
    const { withAuth } = await import('./auth-middleware');
    
    // Apply authentication
    const authHandler = withAuth(handler, { roles: options.roles });
    return authHandler(request, context);
  };
}

/**
 * Get current rate limit status for a key
 */
export function getRateLimitStatus(key: string, config: RateLimitConfig) {
  const entry = rateLimitStore.get(key);
  const now = Date.now();
  
  if (!entry || now > entry.resetTime) {
    return {
      count: 0,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
    };
  }
  
  return {
    count: entry.count,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
  };
}