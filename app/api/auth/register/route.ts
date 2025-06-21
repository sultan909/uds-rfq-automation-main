import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';
import { createUser, generateToken } from '@/lib/auth';
import { z } from 'zod';

// Input validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']).optional().default('EMPLOYEE'),
  department: z.string().optional(),
});

/**
 * POST /api/auth/register
 * User registration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', validation.error.errors),
        { status: 400 }
      );
    }
    
    const { email, password, name, role, department } = validation.data;
    
    // Create user
    const user = await createUser(email, password, name, role, department);
    if (!user) {
      return NextResponse.json(
        createErrorResponse('Failed to create user. Email may already exist.'),
        { status: 409 }
      );
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    const response = NextResponse.json(
      createSuccessResponse({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department
        },
        token
      }),
      { status: 201 }
    );
    
    // Set the token in a secure cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}