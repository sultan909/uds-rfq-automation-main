import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { rfqs, customers, inventoryItems } from '../../../../db/schema';
import { count, eq, gte, sql, and, or } from 'drizzle-orm';

/**
 * GET /api/dashboard/metrics
 * Get dashboard metrics
 */
export async function GET(request: NextRequest) {
  try {
    // Get current date for comparison
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate);
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);
    
    // Format date as ISO string for SQL
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
    
    // RFQ metrics
    const rfqCounts = await db
      .select({
        totalRfqs: count(),
        activeRfqs: sql<number>`COUNT(CASE WHEN status IN ('PENDING', 'IN_REVIEW') THEN 1 END)`,
        completedRfqs: sql<number>`COUNT(CASE WHEN status IN ('APPROVED', 'COMPLETED') THEN 1 END)`,
        declinedRfqs: sql<number>`COUNT(CASE WHEN status = 'REJECTED' THEN 1 END)`
      })
      .from(rfqs);
    
    const rfqMetrics = rfqCounts[0] || { totalRfqs: 0, activeRfqs: 0, completedRfqs: 0, declinedRfqs: 0 };
    
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
    
    // Calculate sales data from completed RFQs
    const salesMetrics = await db
      .select({
        totalSalesCAD: sql<number>`COALESCE(SUM(CASE WHEN status IN ('APPROVED', 'COMPLETED') THEN total_budget ELSE 0 END), 0)`,
        recentSalesCAD: sql<number>`COALESCE(SUM(CASE WHEN status IN ('APPROVED', 'COMPLETED') AND created_at >= ${thirtyDaysAgoISO} THEN total_budget ELSE 0 END), 0)`
      })
      .from(rfqs);
    
    // Calculate conversion rate
    const conversionRate = rfqMetrics.totalRfqs > 0 
      ? (rfqMetrics.completedRfqs / rfqMetrics.totalRfqs) * 100 
      : 0;
    
    // Return metrics
    return NextResponse.json(createSuccessResponse({
      rfqMetrics: {
        totalRfqs: rfqMetrics.totalRfqs,
        activeRfqs: rfqMetrics.activeRfqs,
        completedRfqs: rfqMetrics.completedRfqs,
        declinedRfqs: rfqMetrics.declinedRfqs,
        conversionRate
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
        totalSalesCAD: salesMetrics[0]?.totalSalesCAD || 0,
        recentSalesCAD: salesMetrics[0]?.recentSalesCAD || 0,
        currency: 'CAD'
      },
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    return handleApiError(error);
  }
}