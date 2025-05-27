import { NextResponse } from "next/server"

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: string | null
  meta?: {
    pagination?: {
      page: number
      pageSize: number
      totalItems: number
      totalPages: number
    }
  }
}

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null
  }
}

export function handleApiError(error: unknown): NextResponse<ApiResponse<null>> {
  console.error('API Error:', error);
  
  let errorMessage = 'An unexpected error occurred';
  let statusCode = 500;

  if (error instanceof Error) {
    errorMessage = error.message;
    // Check for specific error types
    if (error.message.includes('not found')) {
      statusCode = 404;
    } else if (error.message.includes('invalid')) {
      statusCode = 400;
    }
  }

  console.error('Handled API Error:', { errorMessage, statusCode });
  
  return NextResponse.json(
    { 
      success: false, 
      data: null, 
      error: errorMessage 
    }, 
    { status: statusCode }
  );
}

export function createErrorResponse(error: string): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error
  }
}

export function createPaginatedResponse<T>({
  data,
  page,
  pageSize,
  totalItems,
}: {
  data: T
  page: number
  pageSize: number
  totalItems: number
}): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
    meta: {
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    },
  }
} 