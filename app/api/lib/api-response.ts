/**
 * Standard API response format for all API endpoints
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    }
  }
}

/**
 * Creates a successful API response
 * @param data The data to return
 * @param meta Any metadata to include
 */
export function createSuccessResponse<T>(data: T, meta?: ApiResponse['meta']): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
    ...(meta && { meta })
  };
}

/**
 * Creates an error API response
 * @param error The error message
 */
export function createErrorResponse(error: string): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error,
  };
}

/**
 * Creates a paginated API response
 * @param data The data to return
 * @param page Current page number
 * @param pageSize Number of items per page
 * @param totalItems Total number of items
 */
export function createPaginatedResponse<T>(
  data: T, 
  page: number, 
  pageSize: number,
  totalItems: number
): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
    meta: {
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize)
      }
    }
  };
}
