// app/api/inventory/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createPaginatedResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { inventoryItems } from '../../../../db/schema';
import { like, or, count } from 'drizzle-orm';

/**
 * GET /api/inventory/search
 * Search through inventory items
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

    // Build search conditions
    const searchCondition = or(
      like(inventoryItems.sku, `%${query}%`),
      like(inventoryItems.mpn, `%${query}%`),
      like(inventoryItems.brand, `%${query}%`),
      like(inventoryItems.description, `%${query}%`),
      like(inventoryItems.warehouseLocation, `%${query}%`)
    );

    // Get total count of matching items
    const totalCount = await db
      .select({ value: count() })
      .from(inventoryItems)
      .where(searchCondition)
      .then(result => result[0]?.value || 0);

    // Get paginated search results
    const searchResults = await db
      .select()
      .from(inventoryItems)
      .where(searchCondition)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Return response
    return NextResponse.json(
      createPaginatedResponse(searchResults, page, pageSize, totalCount)
    );
  } catch (error) {
    return handleApiError(error);
  }
}