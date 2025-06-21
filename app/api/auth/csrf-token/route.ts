import { NextRequest } from 'next/server';
import { handleCSRFTokenRequest } from '@/lib/csrf-protection';

/**
 * GET /api/auth/csrf-token
 * Generate and return a CSRF token for the current session
 */
export async function GET(request: NextRequest) {
  return handleCSRFTokenRequest(request);
}