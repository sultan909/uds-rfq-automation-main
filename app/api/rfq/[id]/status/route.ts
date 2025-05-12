import { NextRequest, NextResponse } from 'next/server';
import { RfqService } from '../../../lib/mock-db/service';
import { createSuccessResponse } from '../../../lib/api-response';
import { handleApiError, ApiError } from '../../../lib/error-handler';
import { RfqStatus } from '../../../lib/mock-db/models';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/rfq/:id/status
 * Update the status of an RFQ
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Validate status
    if (!body.status) {
      throw new ApiError('Status is required');
    }
    
    // Check if the status is valid
    const validStatuses: RfqStatus[] = [
      'new', 'draft', 'priced', 'sent', 'negotiating', 
      'accepted', 'declined', 'processed'
    ];
    
    if (!validStatuses.includes(body.status as RfqStatus)) {
      throw new ApiError(`Invalid status: ${body.status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    // Check if RFQ exists
    const existingRfq = RfqService.getById(id);
    if (!existingRfq) {
      throw new ApiError(`RFQ with ID ${id} not found`, 404);
    }
    
    // Update RFQ status
    const updatedRfq = RfqService.update(id, { status: body.status });
    
    // Return response
    return NextResponse.json(createSuccessResponse(updatedRfq));
  } catch (error) {
    return handleApiError(error);
  }
}