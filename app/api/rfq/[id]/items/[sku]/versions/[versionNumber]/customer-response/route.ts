import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rfqItems, quotationVersions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest, context: { params: { id: string, sku: string, versionNumber: string } }) {
  const { id, sku, versionNumber } = await context.params;
  const response = await request.json();

  // Find the item by RFQ and SKU
  const item = await db.query.rfqItems.findFirst({
    where: (items) => and(
      eq(items.rfqId, Number(id)),
      eq(items.customerSku, sku)
    ),
  });

  if (!item) {
    return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
  }

  // Find the version to update
  const version = await db.query.quotationVersions.findFirst({
    where: and(
      eq(quotationVersions.rfqId, Number(id)),
      eq(quotationVersions.versionNumber, Number(versionNumber))
    ),
  });

  if (!version) {
    return NextResponse.json({ success: false, error: 'Version not found' }, { status: 404 });
  }

  // Update the version with customer response
  const [updatedVersion] = await db
    .update(quotationVersions)
    .set({
      notes: JSON.stringify({
        ...response,
        respondedAt: new Date().toISOString(),
      }),
      updatedAt: new Date(),
    })
    .where(eq(quotationVersions.id, version.id))
    .returning();

  return NextResponse.json({ success: true, data: updatedVersion });
} 