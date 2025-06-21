import { ApiResponse as IApiResponse, ApiError } from '@/lib/types/api';

/**
 * Standard API response format for all API endpoints
 */
export interface ApiResponse<T = any> extends IApiResponse<T> {}

/**
 * Creates a successful API response
 * @param data The data to return
 * @param message Optional success message
 * @param meta Any metadata to include
 */
export function createSuccessResponse<T>(
  data: T, 
  message?: string,
  meta?: ApiResponse<T>['meta']
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta })
  };
}

/**
 * Creates an error API response
 * @param error The error message
 * @param details Optional error details
 */
export function createErrorResponse(
  error: string, 
  details?: ApiError[] | any
): ApiResponse<null> {
  return {
    success: false,
    error,
    ...(details && { details }),
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
