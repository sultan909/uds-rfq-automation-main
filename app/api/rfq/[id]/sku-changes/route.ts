import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { skuNegotiationHistory, inventoryItems, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rfqId = parseInt(id);
    const body = await request.json();

    if (isNaN(rfqId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid RFQ ID' },
        { status: 400 }
      );
    }

    const {
      skuId,
      versionId,
      communicationId,
      changeType,
      oldQuantity,
      newQuantity,
      oldUnitPrice,
      newUnitPrice,
      changeReason,
      changedBy,
    } = body;

    // For now, use a default user ID (in a real app, get from session)
    const enteredByUserId = 1;

    const [newSkuChange] = await db
      .insert(skuNegotiationHistory)
      .values({
        rfqId,
        skuId,
        versionId: versionId || null,
        communicationId: communicationId || null,
        changeType,
        oldQuantity: oldQuantity || null,
        newQuantity: newQuantity || null,
        oldUnitPrice: oldUnitPrice || null,
        newUnitPrice: newUnitPrice || null,
        changeReason: changeReason || null,
        changedBy: changedBy || 'CUSTOMER',
        enteredByUserId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newSkuChange,
    });
  } catch (error) {
    console.error('Error creating SKU change:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create SKU change' },
      { status: 500 }
    );
  }
}