import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { customers, rfqs, customerTypeEnum } from '../../../../db/schema';
import { count, eq, and, gte, sql } from 'drizzle-orm';

/**
 * GET /api/dashboard/customer-stats
 * Get customer statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get all customers
    const allCustomers = await db.select().from(customers);
    
    // Calculate customer type distribution
    const dealerCount = await db
      .select({ value: count() })
      .from(customers)
      .where(eq(customers.type, 'DEALER'))
      .then(result => result[0]?.value || 0);
    
    const wholesalerCount = await db
      .select({ value: count() })
      .from(customers)
      .where(eq(customers.type, 'WHOLESALER'))
      .then(result => result[0]?.value || 0);
    
    const customerTypeDistribution = {
      Dealer: dealerCount,
      Wholesaler: wholesalerCount
    };
    
    // Calculate RFQ distribution by customer type
    const rfqsByCustomerType = await calculateRfqsByCustomerType();
    
    // Calculate top customers by sales volume
    const topCustomers = await calculateTopCustomers();
    
    // Calculate customer retention metrics
    const retentionMetrics = await calculateRetentionMetrics(allCustomers);
    
    // Return statistics
    return NextResponse.json(createSuccessResponse({
      totalCustomers: allCustomers.length,
      customerTypeDistribution,
      rfqsByCustomerType,
      topCustomers,
      retentionMetrics,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    return handleApiError(error);
  }
}

// Helper function to calculate RFQ distribution by customer type
async function calculateRfqsByCustomerType() {
  // Get counts of RFQs by customer type
  const dealerRfqs = await db
    .select({
      totalRfqs: count(),
      totalValueCAD: sql<number>`sum(total_budget)`,
    })
    .from(rfqs)
    .innerJoin(customers, eq(rfqs.customerId, customers.id))
    .where(eq(customers.type, 'DEALER'));

  const wholesalerRfqs = await db
    .select({
      totalRfqs: count(),
      totalValueCAD: sql<number>`sum(total_budget)`,
    })
    .from(rfqs)
    .innerJoin(customers, eq(rfqs.customerId, customers.id))
    .where(eq(customers.type, 'WHOLESALER'));

  // Get counts of converted RFQs by customer type (accepted or processed)
  const dealerConvertedRfqs = await db
    .select({ count: count() })
    .from(rfqs)
    .innerJoin(customers, eq(rfqs.customerId, customers.id))
    .where(and(
      eq(customers.type, 'DEALER'),
      sql`${rfqs.status} IN ('APPROVED', 'COMPLETED')`
    ))
    .then(result => result[0]?.count || 0);

  const wholesalerConvertedRfqs = await db
    .select({ count: count() })
    .from(rfqs)
    .innerJoin(customers, eq(rfqs.customerId, customers.id))
    .where(and(
      eq(customers.type, 'WHOLESALER'),
      sql`${rfqs.status} IN ('APPROVED', 'COMPLETED')`
    ))
    .then(result => result[0]?.count || 0);

  // Calculate conversion rates
  const dealerTotalRfqs = dealerRfqs[0]?.totalRfqs || 0;
  const wholesalerTotalRfqs = wholesalerRfqs[0]?.totalRfqs || 0;

  const distribution = {
    Dealer: {
      totalRfqs: dealerTotalRfqs,
      totalValueCAD: dealerRfqs[0]?.totalValueCAD || 0,
      conversionRate: dealerTotalRfqs > 0 ? (dealerConvertedRfqs / dealerTotalRfqs) * 100 : 0
    },
    Wholesaler: {
      totalRfqs: wholesalerTotalRfqs,
      totalValueCAD: wholesalerRfqs[0]?.totalValueCAD || 0,
      conversionRate: wholesalerTotalRfqs > 0 ? (wholesalerConvertedRfqs / wholesalerTotalRfqs) * 100 : 0
    }
  };

  return distribution;
}

// Helper function to calculate top customers by sales volume
async function calculateTopCustomers() {
  // Get customers with their RFQ data
  const customerSales = await db.execute(sql`
    SELECT 
      c.id, 
      c.name, 
      c.type,
      COUNT(r.id) as rfq_count,
      COUNT(CASE WHEN r.status IN ('APPROVED', 'COMPLETED') THEN 1 END) as accepted_rfq_count,
      SUM(CASE WHEN r.status IN ('APPROVED', 'COMPLETED') THEN r.total_budget ELSE 0 END) as total_spent_cad
    FROM 
      customers c
    LEFT JOIN 
      rfqs r ON c.id = r.customer_id
    GROUP BY 
      c.id, c.name, c.type
    ORDER BY 
      total_spent_cad DESC
    LIMIT 10
  `);

  return customerSales.map(row => {
    const rowRecord = row as Record<string, unknown>;
    return {
      id: String(rowRecord.id || ''),
      name: String(rowRecord.name || ''),
      type: String(rowRecord.type || ''),
      rfqCount: Number(rowRecord.rfq_count || 0),
      acceptedRfqCount: Number(rowRecord.accepted_rfq_count || 0),
      totalSpentCAD: Number(rowRecord.total_spent_cad || 0)
    };
  });
}

// Helper function to calculate customer retention metrics
async function calculateRetentionMetrics(allCustomers: any[]) {
  // Get current date
  const currentDate = new Date();
  
  // Define time periods
  const oneMonthAgo = new Date(currentDate);
  oneMonthAgo.setMonth(currentDate.getMonth() - 1);
  
  const threeMonthsAgo = new Date(currentDate);
  threeMonthsAgo.setMonth(currentDate.getMonth() - 3);
  
  const sixMonthsAgo = new Date(currentDate);
  sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
  
  // Count active customers in each period
  const activeLastMonth = await db
    .select({ customerId: rfqs.customerId })
    .from(rfqs)
    .where(gte(rfqs.createdAt, oneMonthAgo))
    .groupBy(rfqs.customerId)
    .then(results => results.length);
  
  const activeLastThreeMonths = await db
    .select({ customerId: rfqs.customerId })
    .from(rfqs)
    .where(gte(rfqs.createdAt, threeMonthsAgo))
    .groupBy(rfqs.customerId)
    .then(results => results.length);
  
  const activeLastSixMonths = await db
    .select({ customerId: rfqs.customerId })
    .from(rfqs)
    .where(gte(rfqs.createdAt, sixMonthsAgo))
    .groupBy(rfqs.customerId)
    .then(results => results.length);
  
  return {
    activeLastMonth,
    activeLastThreeMonths,
    activeLastSixMonths,
    retentionRate: {
      oneMonth: (activeLastMonth / allCustomers.length) * 100,
      threeMonths: (activeLastThreeMonths / allCustomers.length) * 100,
      sixMonths: (activeLastSixMonths / allCustomers.length) * 100
    }
  };
}