// app/api/customers/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CustomerService } from '../../lib/mock-db/service';
import { createPaginatedResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';

/**
 * GET /api/customers/search
 * Search through customers
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Extract search parameters
    const query = searchParams.get('query');
    if (!query) {
      throw new ApiError('Search query parameter "query" is required', 400);
    }

    // Extract pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    // Perform search using the service (adjusting filter usage)
    const filter = { search: query };
    const searchResults = CustomerService.getAll(filter); // Use the existing getAll with search filter

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