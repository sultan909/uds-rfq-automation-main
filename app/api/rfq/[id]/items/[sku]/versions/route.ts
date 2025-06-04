import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rfqItems, quotationVersions } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; sku: string }> }
) {
  try {
    const { id, sku } = await context.params;

    // Find the item by RFQ and SKU
    const item = await db.query.rfqItems.findFirst({
      where: (items) => and(
        eq(items.rfqId, Number(id)),
        eq(items.customerSku, sku)
      ),
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    // Get versions for this item
    const versions = await db.query.quotationVersions.findMany({
      where: eq(quotationVersions.rfqId, Number(id)),
      orderBy: [desc(quotationVersions.versionNumber)]
    });

    return NextResponse.json({
      success: true,
      data: versions
    });
  } catch (error) {
    console.error('Error fetching item versions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; sku: string }> }
) {
  try {
    const { id, sku } = await context.params;
    const body = await request.json();

    // Find the item by RFQ and SKU
    const item = await db.query.rfqItems.findFirst({
      where: (items) => and(
        eq(items.rfqId, Number(id)),
        eq(items.customerSku, sku)
      ),
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    // Get the latest version number
    const latestVersion = await db.query.quotationVersions.findFirst({
      where: eq(quotationVersions.rfqId, Number(id)),
      orderBy: [desc(quotationVersions.versionNumber)]
    });

    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    // Create new version
    const [version] = await db.insert(quotationVersions).values({
      rfqId: Number(id),
      versionNumber: nextVersionNumber,
      entryType: 'internal_quote',
      status: body.status || 'NEW',
      estimatedPrice: body.estimatedPrice || 0,
      finalPrice: body.finalPrice || 0,
      changes: body.changes,
      notes: null,
      createdBy: body.createdBy || 'System',
      submittedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Also update the rfqItem with the new values
    await db.update(rfqItems)
      .set({
        finalPrice: body.finalPrice,
        estimatedPrice: body.estimatedPrice,
        status: body.status || 'NEW',
        updatedAt: new Date(),
      })
      .where(eq(rfqItems.id, item.id));

    return NextResponse.json({
      success: true,
      data: version
    });
  } catch (error) {
    console.error('Error creating item version:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create version' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; sku: string }> }
) {
  try {
    const { id, sku } = await context.params;
    const body = await request.json();
    const { versionNumber, customerResponse } = body;

    // Find the item by RFQ and SKU
    const item = await db.query.rfqItems.findFirst({
      where: (items) => and(
        eq(items.rfqId, Number(id)),
        eq(items.customerSku, sku)
      ),
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    // Find the version to update
    const version = await db.query.quotationVersions.findFirst({
      where: and(
        eq(quotationVersions.rfqId, Number(id)),
        eq(quotationVersions.versionNumber, versionNumber)
      ),
    });

    if (!version) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      );
    }

    // Update the version with customer response
    const [updatedVersion] = await db
      .update(quotationVersions)
      .set({
        notes: JSON.stringify({
          ...customerResponse,
          respondedAt: new Date().toISOString(),
        }),
        updatedAt: new Date(),
      })
      .where(eq(quotationVersions.id, version.id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedVersion
    });
  } catch (error) {
    console.error('Error updating item version:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update version' },
      { status: 500 }
    );
  }
} 