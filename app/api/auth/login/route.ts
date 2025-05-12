import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';

/**
 * POST /api/auth/login
 * User login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        createErrorResponse('Email and password are required'),
        { status: 400 }
      );
    }
    
    // In a real app, we would validate the credentials against a database
    // and create a session or JWT token
    
    // For mock purposes, we'll just check if the email contains '@'
    // and the password is at least 6 characters long
    if (!body.email.includes('@') || body.password.length < 6) {
      return NextResponse.json(
        createErrorResponse('Invalid credentials'),
        { status: 401 }
      );
    }
    
    // Create a mock JWT token
    const token = `mock-token-${Date.now()}`;
    
    // In a real app, we would store the token in a cookie or return it
    // to be stored in local storage
    
    const response = NextResponse.json(
      createSuccessResponse({
        user: {
          id: '1',
          email: body.email,
          name: 'Test User'
        },
        token
      })
    );
    
    // Set the token in a cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
    
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}