import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { rfqs, customers } from '../../../../db/schema';
import { desc, eq, and, or, sql, gte, lte } from 'drizzle-orm';

/**
 * GET /api/dashboard/rfq-list
 * Get list of RFQs for dashboard
 * Query parameters:
 * - startDate: Start date for filtering (ISO string)
 * - endDate: End date for filtering (ISO string) 
 * - includeProcessed: Whether to include processed RFQs (boolean)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const includeProcessed = searchParams.get('includeProcessed') === 'true';

    // Parse dates if provided
    const startDate = startDateParam ? new Date(startDateParam) : null;
    const endDate = endDateParam ? new Date(endDateParam) : null;

    // Get active RFQs (not affected by date range)
    const activeRfqList = await db
      .select({
        id: rfqs.id,
        rfqNumber: rfqs.rfqNumber,
        customerId: rfqs.customerId,
        customerName: customers.name,
        createdAt: rfqs.createdAt,
        updatedAt: rfqs.updatedAt,
        status: rfqs.status,
        totalBudget: rfqs.totalBudget,
        itemCount: sql<number>`(SELECT COUNT(*) FROM rfq_items WHERE rfq_id = ${rfqs.id})`
      })
      .from(rfqs)
      .leftJoin(customers, eq(rfqs.customerId, customers.id))
      .where(
        or(
          eq(rfqs.status, 'NEGOTIATING'),
          eq(rfqs.status, 'DRAFT'),
          eq(rfqs.status, 'SENT'),
          eq(rfqs.status, 'NEW')
        )
      )
      .orderBy(desc(rfqs.updatedAt))
      .limit(10);

    // Get completed RFQs (recent ones only - last 30 days)
    const completedRfqList = await db
      .select({
        id: rfqs.id,
        rfqNumber: rfqs.rfqNumber,
        customerId: rfqs.customerId,
        customerName: customers.name,
        createdAt: rfqs.createdAt,
        updatedAt: rfqs.updatedAt,
        status: rfqs.status,
        totalBudget: rfqs.totalBudget,
        itemCount: sql<number>`(SELECT COUNT(*) FROM rfq_items WHERE rfq_id = ${rfqs.id})`
      })
      .from(rfqs)
      .leftJoin(customers, eq(rfqs.customerId, customers.id))
      .where(
        and(
          or(
            eq(rfqs.status, 'ACCEPTED'),
            eq(rfqs.status, 'DECLINED')
          ),
          gte(rfqs.updatedAt, sql`NOW() - INTERVAL '30 days'`)
        )
      )
      .orderBy(desc(rfqs.updatedAt))
      .limit(10);

    // Get processed RFQs based on date range if includeProcessed is true
    let processedRfqList: any[] = [];
    if (includeProcessed && startDate && endDate) {
      processedRfqList = await db
        .select({
          id: rfqs.id,
          rfqNumber: rfqs.rfqNumber,
          customerId: rfqs.customerId,
          customerName: customers.name,
          createdAt: rfqs.createdAt,
          updatedAt: rfqs.updatedAt,
          status: rfqs.status,
          totalBudget: rfqs.totalBudget,
          itemCount: sql<number>`(SELECT COUNT(*) FROM rfq_items WHERE rfq_id = ${rfqs.id})`
        })
        .from(rfqs)
        .leftJoin(customers, eq(rfqs.customerId, customers.id))
        .where(
          and(
            eq(rfqs.status, 'PROCESSED'),
            gte(rfqs.updatedAt, startDate),
            lte(rfqs.updatedAt, endDate)
          )
        )
        .orderBy(desc(rfqs.updatedAt));
    }

    return NextResponse.json(createSuccessResponse({
      activeRfqs: activeRfqList,
      completedRfqs: completedRfqList,
      processedRfqs: processedRfqList
    }));
  } catch (error) {
    return handleApiError(error);
  }
} 