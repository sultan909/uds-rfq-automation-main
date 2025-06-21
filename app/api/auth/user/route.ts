import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';
import { withAuth } from '@/lib/auth-middleware';

/**
 * GET /api/auth/user
 * Get current authenticated user information
 */
export const GET = withAuth(async (request: NextRequest, context: any, user) => {
  try {
    return NextResponse.json(
      createSuccessResponse({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
});