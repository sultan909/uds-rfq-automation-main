import { NextRequest, NextResponse } from 'next/server';
import { CustomerService, RfqService } from '../../lib/mock-db/service';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/customers/:id
 * Get a specific customer by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Get customer
    const customer = CustomerService.getById(id);
    
    // Check if customer exists
    if (!customer) {
      throw new ApiError(`Customer with ID ${id} not found`, 404);
    }
    
    // Return response
    return NextResponse.json(createSuccessResponse(customer));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/customers/:id
 * Update a specific customer
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Check if customer exists
    const existingCustomer = CustomerService.getById(id);
    if (!existingCustomer) {
      throw new ApiError(`Customer with ID ${id} not found`, 404);
    }
    
    // Update customer
    const updatedCustomer = CustomerService.update(id, body);
    
    // Return response
    return NextResponse.json(createSuccessResponse(updatedCustomer));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/customers/:id
 * Delete a customer (not implemented in the mock service)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // In a real implementation, we would delete the customer
    // For the mock implementation, we'll just return a success message
    
    const { id } = params;
    
    // Check if customer exists
    const existingCustomer = CustomerService.getById(id);
    if (!existingCustomer) {
      throw new ApiError(`Customer with ID ${id} not found`, 404);
    }
    
    // Return success response
    return NextResponse.json(
      createSuccessResponse({ message: `Customer ${id} deleted successfully` })
    );
  } catch (error) {
    return handleApiError(error);
  }
}