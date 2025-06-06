import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../../lib/api-response';
import { handleApiError, ApiError } from '../../../lib/error-handler';
import { db } from '../../../../../db';
import { rfqItems, inventoryItems } from '../../../../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/rfq/:id/items
 * Get all items for a specific RFQ
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Get RFQ items with inventory data
    const items = await db
      .select({
        item: rfqItems,
        inventory: {
          id: inventoryItems.id,
          sku: inventoryItems.sku,
          description: inventoryItems.description,
          stock: inventoryItems.stock,
          cost: inventoryItems.cost,
          costCurrency: inventoryItems.costCurrency
        }
      })
      .from(rfqItems)
      .leftJoin(inventoryItems, eq(rfqItems.internalProductId, inventoryItems.id))
      .where(eq(rfqItems.rfqId, parseInt(id)));

    // Transform the data to match the expected format
    const transformedItems = items.map(item => ({
      ...item.item,
      inventory: item.inventory
    }));

    return NextResponse.json(createSuccessResponse(transformedItems));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/rfq/:id/items
 * Add items to an RFQ
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      throw new ApiError('At least one item is required');
    }

    // Process each item to find inventory by SKU
    const processedItems = await Promise.all(body.items.map(async (item: any) => {
      let internalProductId = item.internalProductId;
      let inventoryData = null;

      // If we have a customer SKU but no internal product ID, try to find the inventory item
      if (item.customerSku && !internalProductId) {
        const inventoryItem = await db.query.inventoryItems.findFirst({
          where: eq(inventoryItems.sku, item.customerSku)
        });
        if (inventoryItem) {
          internalProductId = inventoryItem.id;
          inventoryData = {
            id: inventoryItem.id,
            sku: inventoryItem.sku,
            mpn: inventoryItem.mpn,
            brand: inventoryItem.brand,
            description: inventoryItem.description,
            quantityOnHand: inventoryItem.quantityOnHand,
            quantityReserved: inventoryItem.quantityReserved,
            warehouseLocation: inventoryItem.warehouseLocation,
            lowStockThreshold: inventoryItem.lowStockThreshold,
            cost: inventoryItem.cost,
            costCurrency: inventoryItem.costCurrency,
            stock: inventoryItem.stock
          };
        }
      }

      return {
        rfqId: parseInt(id),
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || 'pcs',
        customerSku: item.customerSku,
        internalProductId: internalProductId,
        suggestedPrice: item.suggestedPrice,
        finalPrice: item.finalPrice,
        currency: item.currency || 'CAD',
        status: item.status || 'PENDING',
        estimatedPrice: item.estimatedPrice,
        inventory: inventoryData
      };
    }));

    // Insert items
    const newItems = await db
      .insert(rfqItems)
      .values(processedItems.map(item => ({
        rfqId: item.rfqId,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        customerSku: item.customerSku,
        internalProductId: item.internalProductId,
        suggestedPrice: item.suggestedPrice,
        finalPrice: item.finalPrice,
        currency: item.currency,
        status: item.status,
        estimatedPrice: item.estimatedPrice
      })))
      .returning();

    // Return items with inventory data
    const itemsWithInventory = newItems.map((item, index) => ({
      ...item,
      inventory: processedItems[index].inventory
    }));

    return NextResponse.json(
      createSuccessResponse(itemsWithInventory),
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/rfq/:id/items
 * Update items in an RFQ
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      throw new ApiError('At least one item is required');
    }

    // Update items
    const updatedItems = await Promise.all(
      body.items.map(async (item: any) => {
        const [updated] = await db
          .update(rfqItems)
          .set({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            customerSku: item.customerSku,
            internalProductId: item.internalProductId,
            suggestedPrice: item.suggestedPrice,
            finalPrice: item.finalPrice,
            currency: item.currency,
            status: item.status,
            estimatedPrice: item.estimatedPrice
          })
          .where(eq(rfqItems.id, item.id))
          .returning();
        return updated;
      })
    );

    return NextResponse.json(createSuccessResponse(updatedItems));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/rfq/:id/items
 * Remove items from an RFQ
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Validate required fields
    if (!body.itemIds || !Array.isArray(body.itemIds) || body.itemIds.length === 0) {
      throw new ApiError('At least one item ID is required');
    }

    // Delete items
    await db
      .delete(rfqItems)
      .where(
        and(
          eq(rfqItems.rfqId, parseInt(id)),
          inArray(rfqItems.id, body.itemIds.map((id: string) => parseInt(id)))
        )
      );

    return NextResponse.json(
      createSuccessResponse({ message: 'Items deleted successfully' })
    );
  } catch (error) {
    return handleApiError(error);
  }
} 