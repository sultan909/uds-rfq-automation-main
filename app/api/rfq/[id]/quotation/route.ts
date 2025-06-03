import { NextResponse } from 'next/server';
import { db } from '@/db';
import { rfqs, quotationVersions, quotationVersionItems, rfqItems } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { CreateQuotationRequest } from '@/lib/types/quotation';
import { getNextRfqStatus, canCreateVersion, canEditItems } from '@/lib/utils/rfq-status';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body: CreateQuotationRequest = await request.json();
    const { entryType, notes, items } = body;

    const rfqId = parseInt(params.id);

    // Validate RFQ exists and is in a valid state for editing
    const rfq = await db.query.rfqs.findFirst({
      where: eq(rfqs.id, rfqId),
    });

    if (!rfq) {
      return NextResponse.json(
        { success: false, error: 'RFQ not found' },
        { status: 404 }
      );
    }

    // Check if RFQ is in an editable state
    if (!canCreateVersion(rfq.status as any)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot create quotation for RFQ in ${rfq.status} state` 
        },
        { status: 400 }
      );
    }

    // Validate items
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items provided for quotation' },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.skuId || item.quantity <= 0 || item.unitPrice < 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid item data: all items must have valid SKU ID, positive quantity, and non-negative price' 
          },
          { status: 400 }
        );
      }
    }

    // Get the latest version number
    const latestVersion = await db.query.quotationVersions.findFirst({
      where: eq(quotationVersions.rfqId, rfqId),
      orderBy: [desc(quotationVersions.versionNumber)],
    });

    // Calculate total prices
    const totalEstimatedPrice = items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0
    );

    // Create the new version
    const [newVersion] = await db.insert(quotationVersions).values({
      rfqId,
      versionNumber: (latestVersion?.versionNumber || 0) + 1,
      entryType,
      status: 'NEW',
      estimatedPrice: Math.round(totalEstimatedPrice),
      finalPrice: Math.round(totalEstimatedPrice),
      changes: `Created from Items tab with ${items.length} items`,
      notes,
      createdBy: 'System', // TODO: Get from auth context
      submittedByUserId: null, // TODO: Get from auth context
    }).returning();
    // Insert quotation items
    if (items.length > 0) {
      const quotationItemsData = items.map(item => ({
        versionId: newVersion.id,
        skuId: item.skuId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        comment: item.comment || null,
      }));

      await db.insert(quotationVersionItems).values(quotationItemsData);
    }

    // Update RFQ status and current version
    const newStatus = getNextRfqStatus(rfq.status as any, entryType);

    await db.update(rfqs)
      .set({
        status: newStatus,
        currentVersionId: newVersion.id,
        updatedAt: new Date(),
      })
      .where(eq(rfqs.id, rfqId));

    // Fetch the complete version with items for response
    const completeVersion = await db.query.quotationVersions.findFirst({
      where: eq(quotationVersions.id, newVersion.id),
      with: {
        items: {
          with: {
            sku: {
              columns: {
                id: true,
                sku: true,
                description: true,
                mpn: true,
                brand: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: completeVersion,
    });
  } catch (error) {
    console.error('Error creating quotation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create quotation',
      },
      { status: 500 }
    );
  }
}
