import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { skuNegotiationHistory, inventoryItems, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rfqId = parseInt(id);

    if (isNaN(rfqId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid RFQ ID' },
        { status: 400 }
      );
    }

    // Check if table exists and return empty array if not
    let skuChanges = [];
    
    try {
      skuChanges = await db
        .select({
          id: skuNegotiationHistory.id,
          rfqId: skuNegotiationHistory.rfqId,
          skuId: skuNegotiationHistory.skuId,
          versionId: skuNegotiationHistory.versionId,
          communicationId: skuNegotiationHistory.communicationId,
          changeType: skuNegotiationHistory.changeType,
          oldQuantity: skuNegotiationHistory.oldQuantity,
          newQuantity: skuNegotiationHistory.newQuantity,
          oldUnitPrice: skuNegotiationHistory.oldUnitPrice,
          newUnitPrice: skuNegotiationHistory.newUnitPrice,
          changeReason: skuNegotiationHistory.changeReason,
          changedBy: skuNegotiationHistory.changedBy,
          enteredByUserId: skuNegotiationHistory.enteredByUserId,
          createdAt: skuNegotiationHistory.createdAt,
          sku: {
            id: inventoryItems.id,
            sku: inventoryItems.sku,
            description: inventoryItems.description,
          },
          enteredByUser: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(skuNegotiationHistory)
        .leftJoin(inventoryItems, eq(skuNegotiationHistory.skuId, inventoryItems.id))
        .leftJoin(users, eq(skuNegotiationHistory.enteredByUserId, users.id))
        .where(eq(skuNegotiationHistory.rfqId, rfqId))
        .orderBy(desc(skuNegotiationHistory.createdAt));
    } catch (dbError) {
      console.error('Database query error for SKU history:', dbError);
      
      // Check if it's a table/column not found error
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      if (errorMessage.includes('relation') || errorMessage.includes('column') || errorMessage.includes('table')) {
        console.warn('SKU negotiation history table may not exist yet, returning empty array');
        skuChanges = [];
      } else {
        throw dbError; // Re-throw if it's a different type of error
      }
    }

    return NextResponse.json({
      success: true,
      data: skuChanges,
    });
  } catch (error) {
    console.error('Error fetching SKU history:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Detailed error:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      rfqId: request.nextUrl.pathname
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch SKU history',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}