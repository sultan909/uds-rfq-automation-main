import { NextResponse } from 'next/server';
import { createErrorResponse } from './api-response';

/**
 * Custom API error class with status code
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

/**
 * Handles API errors and returns standardized response
 * @param error The error object
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    return NextResponse.json(createErrorResponse(error.message), { status: error.status });
  }
  
  // Handle validation errors or other specific error types
  // ...
  
  // Default error handler for unknown errors
  return NextResponse.json(
    createErrorResponse('An unexpected error occurred'),
    { status: 500 }
  );
}

/**
 * Helper to validate required request parameters
 * @param params Object containing parameters to validate
 * @param requiredParams Array of required parameter names
 * @throws ApiError if any required params are missing
 */
export function validateRequiredParams(
  params: Record<string, any>,
  requiredParams: string[]
): void {
  const missingParams = requiredParams.filter(param => 
    params[param] === undefined || params[param] === null || params[param] === ''
  );
  
  if (missingParams.length > 0) {
    throw new ApiError(`Missing required parameters: ${missingParams.join(', ')}`, 400);
  }
}