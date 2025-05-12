import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';

/**
 * GET /api/auth/user
 * Get current authenticated user information
 */
export async function GET(request: NextRequest) {
  try {
    // In a real app, we would validate the auth token and fetch the user
    // information from the database
    
    const authToken = request.cookies.get('auth_token')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        createErrorResponse('Not authenticated'),
        { status: 401 }
      );
    }
    
    // Mock user data
    const user = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin'
    };
    
    return NextResponse.json(createSuccessResponse(user));
  } catch (error) {
    return handleApiError(error);
  }
}