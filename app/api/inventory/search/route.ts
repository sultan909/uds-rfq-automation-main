import { NextRequest, NextResponse } from 'next/server';
import { createPaginatedResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { withAuth } from '@/lib/auth-middleware';
import { type User } from '@/lib/auth';
import { db } from '../../../../db';
import { inventoryItems } from '../../../../db/schema';
import { eq, like, and, or, count, sql } from 'drizzle-orm';

/**
 * GET /api/inventory/search
 * Search through inventory items with pagination
 */
async function searchInventoryHandler(request: NextRequest, context: any, user: User) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract search parameters
    const query = searchParams.get('query');
    if (!query || query.trim() === '') {
      throw new ApiError('Search query is required', 400);
    }
    
    // Extract filter parameters
    const lowStock = searchParams.get('lowStock') === 'true';
    const outOfStock = searchParams.get('outOfStock') === 'true';
    
    // Extract pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10) || 10));
    
    // Build search conditions
    const searchQuery = query.trim();
    const searchConditions = or(
      like(inventoryItems.sku, `%${searchQuery}%`),
      like(inventoryItems.description, `%${searchQuery}%`),
      like(inventoryItems.brand, `%${searchQuery}%`),
      like(inventoryItems.mpn, `%${searchQuery}%`)
    );
    
    // Build additional filter conditions
    const conditions = [searchConditions];
    
    if (lowStock) {
      conditions.push(and(
        sql`${inventoryItems.stock} <= ${inventoryItems.lowStockThreshold}`,
        sql`${inventoryItems.stock} > 0`
      ));
    }
    
    if (outOfStock) {
      conditions.push(eq(inventoryItems.stock, 0));
    }
    
    // Get total count
    const totalCount = await db
      .select({ value: count() })
      .from(inventoryItems)
      .where(and(...conditions))
      .then((result) => result[0]?.value || 0);
    
    // Get paginated items
    const items = await db
      .select()
      .from(inventoryItems)
      .where(and(...conditions))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    
    // Return response
    return NextResponse.json(
      createPaginatedResponse(items, page, pageSize, totalCount)
    );
  } catch (error) {
    console.error('Inventory search API Error:', error);
    return handleApiError(error);
  }
}

// Export the authenticated handler
export const GET = withAuth(searchInventoryHandler);