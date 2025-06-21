import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';
import { withAuth } from '@/lib/auth-middleware';
import { type User } from '@/lib/auth';
import { db } from '../../../../db';
import { rfqs, customers, inventoryItems } from '../../../../db/schema';
import { count, eq, gte, sql, and, or } from 'drizzle-orm';

/**
 * GET /api/dashboard/metrics
 * Get dashboard metrics with weekly data for conversion rate and sales volume
 */
async function getDashboardMetricsHandler(request: NextRequest, context: any, user: User) {
  try {
    // Get current date for comparison
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate);
    const sevenDaysAgo = new Date(currentDate);
    const fourteenDaysAgo = new Date(currentDate);
    
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);
    sevenDaysAgo.setDate(currentDate.getDate() - 7);
    fourteenDaysAgo.setDate(currentDate.getDate() - 14);
    
    // Format dates as ISO strings for SQL
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();
    const fourteenDaysAgoISO = fourteenDaysAgo.toISOString();
    
    // RFQ metrics with weekly data
    const rfqCounts = await db
      .select({
        totalRfqs: count(),
        activeRfqs: sql<number>`COUNT(CASE WHEN status IN ('DRAFT', 'NEGOTIATING') THEN 1 END)`,
        completedRfqs: sql<number>`COUNT(CASE WHEN status IN ('ACCEPTED', 'PROCESSED') THEN 1 END)`,
        declinedRfqs: sql<number>`COUNT(CASE WHEN status = 'DECLINED' THEN 1 END)`,
        // Weekly metrics
        weeklyCompletedRfqs: sql<number>`COUNT(CASE WHEN status IN ('ACCEPTED', 'PROCESSED') AND created_at >= ${sevenDaysAgoISO} THEN 1 END)`,
        weeklyTotalRfqs: sql<number>`COUNT(CASE WHEN created_at >= ${sevenDaysAgoISO} THEN 1 END)`,
        // Previous week for comparison
        previousWeekCompletedRfqs: sql<number>`COUNT(CASE WHEN status IN ('ACCEPTED', 'PROCESSED') AND created_at >= ${fourteenDaysAgoISO} AND created_at < ${sevenDaysAgoISO} THEN 1 END)`,
        previousWeekTotalRfqs: sql<number>`COUNT(CASE WHEN created_at >= ${fourteenDaysAgoISO} AND created_at < ${sevenDaysAgoISO} THEN 1 END)`
      })
      .from(rfqs);
    
    const rfqMetrics = rfqCounts[0] || { 
      totalRfqs: 0, 
      activeRfqs: 0, 
      completedRfqs: 0, 
      declinedRfqs: 0,
      weeklyCompletedRfqs: 0,
      weeklyTotalRfqs: 0,
      previousWeekCompletedRfqs: 0,
      previousWeekTotalRfqs: 0
    };
    
    // Customer metrics
    const customerCounts = await db
      .select({
        totalCustomers: count()
      })
      .from(customers);
    
    const activeCustomerCount = await db
      .select({
        count: count()
      })
      .from(customers)
      .innerJoin(rfqs, eq(customers.id, rfqs.customerId))
      .groupBy(customers.id)
      .then(result => result.length);
    
    // Inventory metrics
    const inventoryItemsCounts = await db
      .select({
        totalItems: count(),
        lowStockItems: sql<number>`COUNT(CASE WHEN stock <= low_stock_threshold AND stock > 0 THEN 1 END)`,
        outOfStockItems: sql<number>`COUNT(CASE WHEN stock = 0 THEN 1 END)`
      })
      .from(inventoryItems);
    
    const inventoryMetrics = inventoryItemsCounts[0] || { totalItems: 0, lowStockItems: 0, outOfStockItems: 0 };
    
    // Calculate sales data from completed RFQs with weekly breakdown
    const salesMetrics = await db
      .select({
        totalSalesCAD: sql<number>`COALESCE(SUM(CASE WHEN status IN ('ACCEPTED', 'PROCESSED') THEN total_budget ELSE 0 END), 0)`,
        recentSalesCAD: sql<number>`COALESCE(SUM(CASE WHEN status IN ('ACCEPTED', 'PROCESSED') AND created_at >= ${thirtyDaysAgoISO} THEN total_budget ELSE 0 END), 0)`,
        weeklySalesCAD: sql<number>`COALESCE(SUM(CASE WHEN status IN ('ACCEPTED', 'PROCESSED') AND created_at >= ${sevenDaysAgoISO} THEN total_budget ELSE 0 END), 0)`,
        previousWeekSalesCAD: sql<number>`COALESCE(SUM(CASE WHEN status IN ('ACCEPTED', 'PROCESSED') AND created_at >= ${fourteenDaysAgoISO} AND created_at < ${sevenDaysAgoISO} THEN total_budget ELSE 0 END), 0)`
      })
      .from(rfqs);
    
    const salesData = salesMetrics[0] || {
      totalSalesCAD: 0,
      recentSalesCAD: 0,
      weeklySalesCAD: 0,
      previousWeekSalesCAD: 0
    };
    
    // Get weekly processed RFQs - specifically RFQs that have status 'PROCESSED' within the last 7 days
    const weeklyProcessedRfqs = await db
      .select({
        count: count()
      })
      .from(rfqs)
      .where(
        and(
          eq(rfqs.status, 'PROCESSED'),
          gte(rfqs.updatedAt, sevenDaysAgo) // Use updatedAt to track when status changed to PROCESSED
        )
      );
    
    const weeklyProcessedCount = weeklyProcessedRfqs[0]?.count || 0;
    
    // Calculate weekly sales change
    const weeklySalesChange = salesData.previousWeekSalesCAD > 0
      ? ((salesData.weeklySalesCAD - salesData.previousWeekSalesCAD) / salesData.previousWeekSalesCAD) * 100
      : salesData.weeklySalesCAD > 0 ? 100 : 0;
    
    // Return metrics
    return NextResponse.json(createSuccessResponse({
      rfqMetrics: {
        totalRfqs: rfqMetrics.totalRfqs,
        activeRfqs: rfqMetrics.activeRfqs,
        completedRfqs: rfqMetrics.completedRfqs,
        declinedRfqs: rfqMetrics.declinedRfqs,
        weeklyProcessedRfqs: weeklyProcessedCount
      },
      customerMetrics: {
        totalCustomers: customerCounts[0]?.totalCustomers || 0,
        activeCustomers: activeCustomerCount
      },
      inventoryMetrics: {
        totalItems: inventoryMetrics.totalItems,
        lowStockItems: inventoryMetrics.lowStockItems,
        outOfStockItems: inventoryMetrics.outOfStockItems
      },
      salesMetrics: {
        totalSalesCAD: salesData.totalSalesCAD,
        recentSalesCAD: salesData.recentSalesCAD,
        weeklySalesCAD: salesData.weeklySalesCAD,
        weeklySalesChange,
        currency: 'CAD'
      },
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    return handleApiError(error);
  }
}

// Export the authenticated handler
export const GET = withAuth(getDashboardMetricsHandler);
