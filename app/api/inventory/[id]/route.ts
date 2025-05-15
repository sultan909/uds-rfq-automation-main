import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { inventoryItems, marketPricing } from '../../../../db/schema';
import { eq, avg } from 'drizzle-orm';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/inventory/:id
 * Get a specific inventory item by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Get inventory item
    const item = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, parseInt(id)))
      .then(results => results[0]);
    
    // Check if item exists
    if (!item) {
      throw new ApiError(`Inventory item with ID ${id} not found`, 404);
    }
    
    // Get marketplace data for SKU
    const marketplaceData = await db
      .select()
      .from(marketPricing)
      .where(eq(marketPricing.productId, parseInt(id)));
    
    // Get average marketplace price
    const avgMarketPrice = await db
      .select({
        averagePrice: avg(marketPricing.price)
      })
      .from(marketPricing)
      .where(eq(marketPricing.productId, parseInt(id)))
      .then(result => result[0]?.averagePrice || 0);
    
    // Combine item and marketplace data
    const responseData = {
      ...item,
      marketplaceData,
      avgMarketPrice
    };
    
    // Return response
    return NextResponse.json(createSuccessResponse(responseData));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/inventory/:id
 * Update a specific inventory item
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Check if item exists
    const existingItem = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, parseInt(id)))
      .then(results => results[0]);
      
    if (!existingItem) {
      throw new ApiError(`Inventory item with ID ${id} not found`, 404);
    }
    
    // Prepare update values
    const updateValues: Record<string, any> = {};
    
    // Only update fields that are provided in the request body
    if (body.sku !== undefined) updateValues.sku = body.sku;
    if (body.mpn !== undefined) updateValues.mpn = body.mpn;
    if (body.brand !== undefined) updateValues.brand = body.brand;
    if (body.description !== undefined) updateValues.description = body.description;
    if (body.stock !== undefined) updateValues.stock = body.stock;
    if (body.costCad !== undefined) updateValues.costCad = body.costCad;
    if (body.costUsd !== undefined) updateValues.costUsd = body.costUsd;
    if (body.warehouseLocation !== undefined) updateValues.warehouseLocation = body.warehouseLocation;
    if (body.quantityOnHand !== undefined) updateValues.quantityOnHand = body.quantityOnHand;
    if (body.quantityReserved !== undefined) updateValues.quantityReserved = body.quantityReserved;
    if (body.lowStockThreshold !== undefined) updateValues.lowStockThreshold = body.lowStockThreshold;
    
    // Format lastSaleDate as string if it exists
    if (body.lastSaleDate !== undefined) {
      updateValues.lastSaleDate = body.lastSaleDate ? 
        new Date(body.lastSaleDate).toISOString().split('T')[0] : 
        null;
    }
    
    if (body.quickbooksItemId !== undefined) updateValues.quickbooksItemId = body.quickbooksItemId;
    
    // Set updated timestamp
    updateValues.updatedAt = new Date().toISOString();
    
    // Update item
    const [updatedItem] = await db
      .update(inventoryItems)
      .set(updateValues)
      .where(eq(inventoryItems.id, parseInt(id)))
      .returning();
    
    // Return response
    return NextResponse.json(createSuccessResponse(updatedItem));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/inventory/:id
 * Delete an inventory item
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Check if item exists
    const existingItem = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, parseInt(id)))
      .then(results => results[0]);
      
    if (!existingItem) {
      throw new ApiError(`Inventory item with ID ${id} not found`, 404);
    }
    
    // Delete the item
    await db
      .delete(inventoryItems)
      .where(eq(inventoryItems.id, parseInt(id)));
    
    // Return success response
    return NextResponse.json(
      createSuccessResponse({ message: `Inventory item ${id} deleted successfully` })
    );
  } catch (error) {
    return handleApiError(error);
  }
}