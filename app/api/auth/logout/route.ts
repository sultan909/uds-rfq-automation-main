import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';

/**
 * POST /api/auth/logout
 * User logout
 */
export async function POST(request: NextRequest) {
  try {
    // In a real app, we would invalidate the session or JWT token
    
    // Create a response that clears the auth cookie
    const response = NextResponse.json(
      createSuccessResponse({ message: 'Logged out successfully' })
    );
    
    // Clear the auth token cookie
    response.cookies.delete('auth_token');
    
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}