// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
    [key: string]: any;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  path?: (string | number)[];
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  query?: string;
  filters?: Record<string, any>;
}

// HTTP Method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// API Request types
export interface CreateRequest<T> {
  data: T;
}

export interface UpdateRequest<T> {
  data: Partial<T>;
}

export interface BulkOperation<T> {
  items: T[];
  operation: 'create' | 'update' | 'delete';
}

// Database entity base types
export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditableEntity extends BaseEntity {
  createdBy?: number;
  updatedBy?: number;
}