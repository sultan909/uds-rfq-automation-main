import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rfqItems, quotationVersions } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; sku: string } }
) {
  try {
    const { id, sku } = params;
    const { status } = await request.json();

    console.log('Updating item status:', { id, sku, status });

    // Update the item status using Drizzle
    const [updatedItem] = await db
      .update(rfqItems)
      .set({ 
        status,
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
    const latestVersion = await db.query.quotationVersions.findFirst({
      where: eq(quotationVersions.rfqId, parseInt(id)),
      orderBy: [desc(quotationVersions.versionNumber)]
    });
    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;
    await db.insert(quotationVersions).values({
      rfqId: parseInt(id),
      versionNumber: nextVersionNumber,
      entryType: 'internal_quote',
      status: updatedItem.status,
      estimatedPrice: updatedItem.estimatedPrice || 0,
      finalPrice: updatedItem.finalPrice || 0,
      changes: 'Status updated',
      notes: null,
      createdBy: 'System',
      submittedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Successfully updated item status:', updatedItem);
    return NextResponse.json({ success: true, data: updatedItem });
  } catch (error) {
    console.error('Error updating item status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update item status',
        details: error
      },
      { status: 500 }
    );
  }
} 