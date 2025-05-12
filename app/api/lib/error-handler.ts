import { NextResponse } from 'next/server';
import { createErrorResponse } from './api-response';

/**
 * Custom API error class with status code
 */
export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Handles API errors and returns standardized response
 * @param error The error object
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    return NextResponse.json(
      createErrorResponse(error.message),
      { status: error.statusCode }
    );
  }
  
  // Handle validation errors or other specific error types
  // ...
  
  // Default error handler for unknown errors
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  return NextResponse.json(
    createErrorResponse(errorMessage),
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