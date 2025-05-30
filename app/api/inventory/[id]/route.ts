import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, handleApiError } from '@/lib/api-response';
import { db } from '@/db';
import { inventoryItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid inventory ID' },
        { status: 400 }
      );
    }

    const inventoryItem = await db.query.inventoryItems.findFirst({
      where: eq(inventoryItems.id, id)
    });

    if (!inventoryItem) {
      return NextResponse.json(
        { success: false, error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(inventoryItem),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    return handleApiError(error);
  }
}

/**
 * PUT /api/inventory/:id
 * Update a specific inventory item
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const {
      sku,
      mpn,
      brand,
      description,
      stock,
      costCad,
      costUsd,
      warehouseLocation,
      quantityOnHand,
      quantityReserved,
      lowStockThreshold,
    } = body;

    // Validate required fields
    if (!sku || !mpn || !brand || !description) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if SKU is already taken by another item
    const existingItem = await db.query.inventoryItems.findFirst({
      where: eq(inventoryItems.sku, sku),
    });

    if (existingItem && existingItem.id !== parseInt(params.id)) {
      return NextResponse.json(
        { success: false, message: 'SKU already exists' },
        { status: 400 }
      );
    }

    // Update the item
    const [updatedItem] = await db
      .update(inventoryItems)
      .set({
        sku,
        mpn,
        brand,
        description,
        stock,
        costCad,
        costUsd,
        warehouseLocation,
        quantityOnHand,
        quantityReserved,
        lowStockThreshold,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, parseInt(params.id)))
      .returning();

    if (!updatedItem) {
      return NextResponse.json(
        { success: false, message: 'Inventory item not found' },
        { status: 404 }
      );
    }

    return createSuccessResponse(updatedItem);
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
    const [deletedItem] = await db
      .delete(inventoryItems)
      .where(eq(inventoryItems.id, parseInt(params.id)))
      .returning();

    if (!deletedItem) {
      return NextResponse.json(
        { success: false, message: 'Inventory item not found' },
        { status: 404 }
      );
    }

    return createSuccessResponse(deletedItem);
  } catch (error) {
    return handleApiError(error);
  }
}