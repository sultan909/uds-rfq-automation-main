import { NextRequest, NextResponse } from 'next/server';
import { RfqService, CustomerService } from '../../../lib/mock-db/service';
import { createSuccessResponse } from '../../../lib/api-response';
import { handleApiError, ApiError } from '../../../lib/error-handler';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/rfq/:id/quote
 * Generate a quote from an RFQ
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Get RFQ
    const rfq = RfqService.getById(id);
    
    // Check if RFQ exists
    if (!rfq) {
      throw new ApiError(`RFQ with ID ${id} not found`, 404);
    }
    
    // Check if RFQ is in the correct state for quote generation
    if (rfq.status !== 'new' && rfq.status !== 'draft') {
      throw new ApiError(`RFQ with ID ${id} cannot be quoted as it is already in ${rfq.status} state`, 400);
    }
    
    // Get customer
    const customer = CustomerService.getById(rfq.customerId);
    
    // In a real application, we would apply pricing rules, discounts, etc.
    // based on the customer and items
    
    // For the mock implementation, we'll just update the RFQ status and return it
    const updatedRfq = RfqService.update(id, { 
      status: 'priced',
      ...body // Apply any overrides from the request body
    });
    
    if (!updatedRfq) {
      throw new ApiError(`Failed to update RFQ with ID ${id}`, 500);
    }
    
    // Return the updated RFQ as a quote
    return NextResponse.json(
      createSuccessResponse({
        quoteId: `Q-${updatedRfq.rfqNumber}`,
        quoteDate: new Date().toISOString(),
        rfq: updatedRfq,
        customer,
        status: 'generated',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}