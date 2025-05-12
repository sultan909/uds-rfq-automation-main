import { NextRequest, NextResponse } from 'next/server';
import { RfqService } from '../../lib/mock-db/service';
import { createSuccessResponse, createPaginatedResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { RfqStatus } from '../../lib/mock-db/service';

/**
 * GET /api/rfq/search
 * Search through RFQs
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract search parameters
    const query = searchParams.get('query');
    if (!query) {
      throw new ApiError('Search query is required', 400);
    }
    
    // Extract additional filter parameters
    const status = (searchParams.get('status') ?? undefined) as RfqStatus | undefined;
    const customerId = searchParams.get('customerId') ?? undefined;
    const dateFrom = searchParams.get('dateFrom') ?? undefined;
    const dateTo = searchParams.get('dateTo') ?? undefined;
    
    // Extract pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    
    // Get all RFQs for base filtering
    const allRfqs = RfqService.getAll({
      status,
      customerId,
      dateFrom,
      dateTo
    });
    
    // Perform search on the filtered RFQs
    const searchQuery = query.toLowerCase();
    const searchResults = allRfqs.filter(rfq => 
      rfq.rfqNumber.toLowerCase().includes(searchQuery) ||
      rfq.items.some(item => 
        item.sku.toLowerCase().includes(searchQuery) ||
        item.description.toLowerCase().includes(searchQuery)
      )
    );
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedResults = searchResults.slice(startIndex, startIndex + pageSize);
    
    // Return response
    return NextResponse.json(
      createPaginatedResponse(paginatedResults, page, pageSize, searchResults.length)
    );
  } catch (error) {
    return handleApiError(error);
  }
}