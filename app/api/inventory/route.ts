import { NextRequest, NextResponse } from 'next/server';
import { createPaginatedResponse, createSuccessResponse } from '../lib/api-response';
import { handleApiError, ApiError } from '../lib/error-handler';
import { withAuth } from '@/lib/auth-middleware';
import { type User } from '@/lib/auth';
import { db } from '../../../db';
import { inventoryItems } from '../../../db/schema';
import { eq, like, and, or, count, sql } from 'drizzle-orm';

/**
 * GET /api/inventory
 * Get all inventory items with optional filtering and pagination
 */
async function getInventoryHandler(request: NextRequest, context: any, user: User) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract filter parameters
    const lowStock = searchParams.get('lowStock') === 'true';
    const outOfStock = searchParams.get('outOfStock') === 'true';
    const search = searchParams.get('search');
    
    // Extract pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    
    // Build query conditions
    const conditions = [];
    
    if (lowStock) {
      conditions.push(and(
        sql`${inventoryItems.stock} <= ${inventoryItems.lowStockThreshold}`,
        sql`${inventoryItems.stock} > 0`
      ));
    }
    
    if (outOfStock) {
      conditions.push(eq(inventoryItems.stock, 0));
    }
    
    if (search) {
      conditions.push(or(
        like(inventoryItems.sku, `%${search}%`),
        like(inventoryItems.description, `%${search}%`),
        like(inventoryItems.brand, `%${search}%`),
        like(inventoryItems.mpn, `%${search}%`)
      ));
    }
    
    // Get total count
    const totalCount = await db
      .select({ value: count() })
      .from(inventoryItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .then((result) => result[0]?.value || 0);
    
    // Get paginated items
    const items = await db
      .select()
      .from(inventoryItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    
    // Return response
    return NextResponse.json(
      createPaginatedResponse(items, page, pageSize, totalCount)
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/inventory
 * Create a new inventory item
 */
async function createInventoryHandler(request: NextRequest, context: any, user: User) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.sku) {
      throw new ApiError('SKU is required');
    }
    
    if (!body.description) {
      throw new ApiError('Description is required');
    }
    
    if (body.stock === undefined || body.stock === null) {
      body.stock = 0;
    }
    
    if (body.cost === undefined || body.cost === null) {
      throw new ApiError('Cost is required');
    }
    
    if (!body.mpn) {
      throw new ApiError('MPN is required');
    }
    
    if (!body.brand) {
      throw new ApiError('Brand is required');
    }
    
    // Check if SKU already exists
    const existingItem = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.sku, body.sku))
      .then(result => result[0]);
      
    if (existingItem) {
      throw new ApiError(`Inventory item with SKU ${body.sku} already exists`);
    }

    // Format lastSaleDate as string if it exists
    let lastSaleDate = null;
    if (body.lastSaleDate) {
      lastSaleDate = new Date(body.lastSaleDate).toISOString().split('T')[0];
    }
    
    // Create inventory item
    const [newItem] = await db
      .insert(inventoryItems)
      .values({
        sku: body.sku,
        mpn: body.mpn,
        brand: body.brand,
        description: body.description,
        stock: body.stock || 0,
        cost: body.cost,
        costCurrency: body.costCurrency || 'CAD',
        warehouseLocation: body.warehouseLocation,
        quantityOnHand: body.quantityOnHand || body.stock || 0,
        quantityReserved: body.quantityReserved || 0,
        lowStockThreshold: body.lowStockThreshold || 5,
        lastSaleDate: lastSaleDate,
        quickbooksItemId: body.quickbooksItemId
      })
      .returning();
    
    // Return response
    return NextResponse.json(
      createSuccessResponse(newItem),
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// Export the authenticated handlers
export const GET = withAuth(getInventoryHandler);
export const POST = withAuth(createInventoryHandler);