import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { negotiationCommunications, skuNegotiationHistory, rfqs } from '@/db/schema';
import { eq, count, min } from 'drizzle-orm';

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

    // Initialize default values
    let totalCommunications = 0;
    let totalSkuChanges = 0;
    let pendingFollowUps = 0;
    let lastCommunicationDate = null;
    let negotiationDuration = 0;

    try {
      // Get total communications count
      const [commCount] = await db
        .select({ count: count() })
        .from(negotiationCommunications)
        .where(eq(negotiationCommunications.rfqId, rfqId));
      totalCommunications = commCount?.count || 0;
    } catch (error) {
      console.error('Error getting communications count:', error);
    }

    try {
      // Get total SKU changes count
      const [skuCount] = await db
        .select({ count: count() })
        .from(skuNegotiationHistory)
        .where(eq(skuNegotiationHistory.rfqId, rfqId));
      totalSkuChanges = skuCount?.count || 0;
    } catch (error) {
      console.error('Error getting SKU changes count:', error);
    }

    try {
      // Get pending follow-ups count
      const [followUpCount] = await db
        .select({ count: count() })
        .from(negotiationCommunications)
        .where(eq(negotiationCommunications.rfqId, rfqId))
        .where(eq(negotiationCommunications.followUpRequired, true))
        .where(eq(negotiationCommunications.followUpCompleted, false));
      pendingFollowUps = followUpCount?.count || 0;
    } catch (error) {
      console.error('Error getting follow-ups count:', error);
    }

    try {
      // Get last communication date
      const [lastComm] = await db
        .select({ lastDate: min(negotiationCommunications.communicationDate) })
        .from(negotiationCommunications)
        .where(eq(negotiationCommunications.rfqId, rfqId));
      lastCommunicationDate = lastComm?.lastDate || null;
    } catch (error) {
      console.error('Error getting last communication:', error);
    }

    try {
      // Get RFQ creation date for negotiation duration
      const [rfqData] = await db
        .select({ createdAt: rfqs.createdAt })
        .from(rfqs)
        .where(eq(rfqs.id, rfqId));

      if (rfqData && lastCommunicationDate) {
        const diffTime = Math.abs(new Date().getTime() - new Date(rfqData.createdAt).getTime());
        negotiationDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
      }
    } catch (error) {
      console.error('Error calculating negotiation duration:', error);
    }

    const summary = {
      totalCommunications,
      totalSkuChanges,
      pendingFollowUps,
      lastCommunicationDate,
      negotiationDuration,
    };

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error fetching negotiation summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch negotiation summary' },
      { status: 500 }
    );
  }
}