import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rfqItems, itemQuotationVersions } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; sku: string } }
) {
  try {
    const { id, sku } = params;
    const body = await request.json();
    console.log('Received request:', { id, sku, body });

    if (!body.price && body.price !== 0) {
      console.error('Missing price in request body');
      return NextResponse.json(
        { success: false, error: 'Price is required' },
        { status: 400 }
      );
    }

    const price = parseFloat(body.price);
    if (isNaN(price)) {
      console.error('Invalid price value:', body.price);
      return NextResponse.json(
        { success: false, error: 'Invalid price value' },
        { status: 400 }
      );
    }

    console.log('Updating item price:', { id, sku, price });

    // Update the item price using Drizzle
    const [updatedItem] = await db
      .update(rfqItems)
      .set({ 
        finalPrice: price,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(rfqItems.customerSku, sku),
          eq(rfqItems.rfqId, parseInt(id))
        )
      )
      .returning();

    if (!updatedItem) {
      console.error('No item found to update:', { id, sku });
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    // Create a new version for this SKU/item
    // Find latest version number
    const latestVersion = await db.query.itemQuotationVersions.findFirst({
      where: eq(itemQuotationVersions.rfqItemId, updatedItem.id),
      orderBy: [desc(itemQuotationVersions.versionNumber)]
    });
    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;
    await db.insert(itemQuotationVersions).values({
      rfqItemId: updatedItem.id,
      versionNumber: nextVersionNumber,
      status: updatedItem.status,
      estimatedPrice: price,
      finalPrice: price,
      changes: 'Unit price updated',
      createdBy: 'System',
      createdAt: new Date(),
      updatedAt: new Date(),
      customerResponse: null
    });

    console.log('Successfully updated item:', updatedItem);
    return NextResponse.json({ success: true, data: updatedItem });
  } catch (error) {
    console.error('Error updating item price:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update item price',
        details: error
      },
      { status: 500 }
    );
  }
} 