import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '../lib/mock-db/service';
import { createPaginatedResponse, createSuccessResponse } from '../lib/api-response';
import { handleApiError, ApiError } from '../lib/error-handler';

/**
 * GET /api/customers
 * Get all customers with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract filter parameters
    const type = searchParams.get('type') as 'Dealer' | 'Wholesaler' | null;
    const search = searchParams.get('search');
    
    // Extract pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    
    // Apply filtering
    const filter: any = {};
    if (type) filter.type = type;
    if (search) filter.search = search;
    
    // Get customers
    const allCustomers = CustomerService.getAll(filter);
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedCustomers = allCustomers.slice(startIndex, startIndex + pageSize);
    
    // Return response
    return NextResponse.json(
      createPaginatedResponse(paginatedCustomers, page, pageSize, allCustomers.length)
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/customers
 * Create a new customer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      throw new ApiError('Name is required');
    }
    
    if (!body.type || !['Dealer', 'Wholesaler'].includes(body.type)) {
      throw new ApiError('Type must be either "Dealer" or "Wholesaler"');
    }
    
    // Set defaults
    if (!body.lastOrder) {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const year = today.getFullYear();
      body.lastOrder = `${month}/${day}/${year}`;
    }
    
    if (body.totalOrders === undefined) {
      body.totalOrders = 0;
    }
    
    if (body.totalSpentCAD === undefined) {
      body.totalSpentCAD = 0;
    }
    
    // Create customer
    const newCustomer = CustomerService.create(body);
    
    // Return response
    return NextResponse.json(
      createSuccessResponse(newCustomer),
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}