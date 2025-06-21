import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserById, type User } from '@/lib/auth';
import { createErrorResponse } from '@/app/api/lib/api-response';

export interface AuthenticatedRequest extends NextRequest {
  user?: User;
}

/**
 * Middleware to authenticate requests using JWT tokens
 * Can be used in API routes to protect endpoints
 */
export async function authenticate(request: NextRequest): Promise<{ user: User } | NextResponse> {
  try {
    // Get token from cookie or Authorization header
    let token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      // Try Authorization header as fallback
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        createErrorResponse('Authentication required'),
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        createErrorResponse('Invalid or expired token'),
        { status: 401 }
      );
    }

    // Get user from database
    const user = await getUserById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        createErrorResponse('User not found'),
        { status: 401 }
      );
    }

    return { user };
  } catch (error) {
    // Silent error handling - log to monitoring service in production
    return NextResponse.json(
      createErrorResponse('Authentication failed'),
      { status: 401 }
    );
  }
}

/**
 * Role-based authorization middleware
 * Checks if the authenticated user has the required role
 */
export function authorize(allowedRoles: string[]) {
  return async (request: NextRequest): Promise<{ user: User } | NextResponse> => {
    const authResult = await authenticate(request);
    
    // If authentication failed, return the error response
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Check if user has required role
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        createErrorResponse('Insufficient permissions'),
        { status: 403 }
      );
    }

    return { user };
  };
}

/**
 * Higher-order function to wrap API routes with authentication
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, context: any, user: User) => Promise<NextResponse>,
  options: { roles?: string[] } = {}
) {
  return async (request: NextRequest, context: any): Promise<NextResponse> => {
    // Apply authentication or authorization
    const authMiddleware = options.roles 
      ? authorize(options.roles)
      : authenticate;

    const authResult = await authMiddleware(request);

    // If authentication/authorization failed, return the error response
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Call the original handler with the authenticated user
    return handler(request, context, user);
  };
}

/**
 * Extract user from authenticated request
 * Use this in API routes after authentication middleware
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<User | null> {
  const authResult = await authenticate(request);
  
  if (authResult instanceof NextResponse) {
    return null;
  }

  return authResult.user;
}