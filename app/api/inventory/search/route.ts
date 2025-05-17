// app/api/inventory/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, handleApiError } from '@/lib/api-response';
import  {db}  from '../../../../db';
import { inventoryItems } from '../../../../db/schema';
import { or, like } from 'drizzle-orm';

/**
 * GET /api/inventory/search
 * Search through inventory items
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return createSuccessResponse([]);
    }

    const items = await db
      .select()
      .from(inventoryItems)
      .where(
        or(
          like(inventoryItems.description, `%${query}%`),
          like(inventoryItems.sku, `%${query}%`),
          like(inventoryItems.mpn, `%${query}%`),
          like(inventoryItems.brand, `%${query}%`)
        )
      );

    return createSuccessResponse(items);
  } catch (error) {
    return handleApiError(error);
  }
}