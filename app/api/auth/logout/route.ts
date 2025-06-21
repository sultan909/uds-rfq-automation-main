import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';

/**
 * POST /api/auth/logout
 * User logout - clears authentication cookie
 */
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      createSuccessResponse({ message: 'Logged out successfully' })
    );
    
    // Remove the token cookie by setting it to expire immediately
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/',
    });
    
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}