import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rfqItems, quotationVersions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(request: NextRequest, { params }: { params: { id: string, sku: string, versionNumber: string } }) {
  const { id, sku, versionNumber } = params;
  const { status } = await request.json();

  const item = await db.query.rfqItems.findFirst({
    where: and(
      eq(rfqItems.rfqId, Number(id)),
      eq(rfqItems.customerSku, sku)
    ),
  });

  if (!item) {
    return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
  }

  const version = await db.query.quotationVersions.findFirst({
    where: and(
      eq(quotationVersions.rfqId, Number(id)),
      eq(quotationVersions.versionNumber, Number(versionNumber))
    ),
  });

  if (!version) {
    return NextResponse.json({ success: false, error: 'Version not found' }, { status: 404 });
  }

  const [updatedVersion] = await db
    .update(quotationVersions)
    .set({ 
      status,
      updatedAt: new Date()
    })
    .where(eq(quotationVersions.id, version.id))
    .returning();

  return NextResponse.json({ success: true, data: updatedVersion });
} 