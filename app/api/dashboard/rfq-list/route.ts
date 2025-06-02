import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { rfqs, customers } from '../../../../db/schema';
import { desc, eq, and, or, sql, gte } from 'drizzle-orm';

/**
 * GET /api/dashboard/rfq-list
 * Get list of RFQs for dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Get active and recent RFQs
    const rfqList = await db
      .select({
        id: rfqs.id,
        rfqNumber: rfqs.rfqNumber,
        customerId: rfqs.customerId,
        customerName: customers.name,
        createdAt: rfqs.createdAt,
        updatedAt: rfqs.updatedAt,
        status: rfqs.status,
        itemCount: sql<number>`(SELECT COUNT(*) FROM rfq_items WHERE rfq_id = ${rfqs.id})`
      })
      .from(rfqs)
      .leftJoin(customers, eq(rfqs.customerId, customers.id))
      .where(
        or(
          // Active RFQs
          or(
            eq(rfqs.status, 'PENDING'),
            eq(rfqs.status, 'IN_REVIEW')
          ),
          // Recently completed RFQs
          and(
            or(
              eq(rfqs.status, 'APPROVED'),
              eq(rfqs.status, 'COMPLETED'),
              eq(rfqs.status, 'REJECTED')
            ),
            gte(rfqs.createdAt, sql`NOW() - INTERVAL '30 days'`)
          )
        )
      )
      .orderBy(desc(rfqs.updatedAt))
      .limit(10);

    // Separate active and completed RFQs
    const activeRfqs = rfqList.filter(rfq => 
      ['PENDING', 'IN_REVIEW'].includes(rfq.status)
    );

    const completedRfqs = rfqList.filter(rfq => 
      ['APPROVED', 'COMPLETED', 'REJECTED'].includes(rfq.status)
    );

    return NextResponse.json(createSuccessResponse({
      activeRfqs,
      completedRfqs
    }));
  } catch (error) {
    return handleApiError(error);
  }
} 