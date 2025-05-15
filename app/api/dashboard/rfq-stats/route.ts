import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { rfqs } from '../../../../db/schema';
import { count, gte, sql } from 'drizzle-orm';

/**
 * GET /api/dashboard/rfq-stats
 * Get RFQ statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get current date for time-based filtering
    const currentDate = new Date();
    
    // Calculate stats for different time periods
    const stats = await calculateStats(currentDate);
    
    // Calculate status distribution
    const statusDistribution = await calculateStatusDistribution();
    
    // Get current month and year
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Calculate monthly trends
    const monthlyTrends = await calculateMonthlyTrends(currentMonth, currentYear);
    
    // Return statistics
    return NextResponse.json(createSuccessResponse({
      timeBasedStats: stats,
      statusDistribution,
      monthlyTrends,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    return handleApiError(error);
  }
}

// Helper function to calculate stats for different time periods
async function calculateStats(currentDate: Date) {
  const thirtyDaysAgo = new Date(currentDate);
  thirtyDaysAgo.setDate(currentDate.getDate() - 30);
  
  const ninetyDaysAgo = new Date(currentDate);
  ninetyDaysAgo.setDate(currentDate.getDate() - 90);
  
  const oneYearAgo = new Date(currentDate);
  oneYearAgo.setFullYear(currentDate.getFullYear() - 1);

  // Get stats for last 30 days
  const last30DaysStats = await db
    .select({
      totalRfqs: count(),
      totalValueCAD: sql<number>`COALESCE(SUM(total_budget), 0)`,
      convertedCount: sql<number>`COUNT(CASE WHEN status IN ('APPROVED', 'COMPLETED') THEN 1 END)`
    })
    .from(rfqs)
    .where(gte(rfqs.createdAt, thirtyDaysAgo));

  // Get stats for last 90 days
  const last90DaysStats = await db
    .select({
      totalRfqs: count(),
      totalValueCAD: sql<number>`COALESCE(SUM(total_budget), 0)`,
      convertedCount: sql<number>`COUNT(CASE WHEN status IN ('APPROVED', 'COMPLETED') THEN 1 END)`
    })
    .from(rfqs)
    .where(gte(rfqs.createdAt, ninetyDaysAgo));

  // Get stats for last year
  const lastYearStats = await db
    .select({
      totalRfqs: count(),
      totalValueCAD: sql<number>`COALESCE(SUM(total_budget), 0)`,
      convertedCount: sql<number>`COUNT(CASE WHEN status IN ('APPROVED', 'COMPLETED') THEN 1 END)`
    })
    .from(rfqs)
    .where(gte(rfqs.createdAt, oneYearAgo));

  // Calculate averages and conversion rates
  const last30Stats = last30DaysStats[0] || { totalRfqs: 0, totalValueCAD: 0, convertedCount: 0 };
  const last90Stats = last90DaysStats[0] || { totalRfqs: 0, totalValueCAD: 0, convertedCount: 0 };
  const yearStats = lastYearStats[0] || { totalRfqs: 0, totalValueCAD: 0, convertedCount: 0 };

  return {
    last30Days: {
      totalRfqs: last30Stats.totalRfqs,
      averageValueCAD: last30Stats.totalRfqs > 0 
        ? last30Stats.totalValueCAD / last30Stats.totalRfqs 
        : 0,
      conversionRate: last30Stats.totalRfqs > 0 
        ? (last30Stats.convertedCount / last30Stats.totalRfqs) * 100 
        : 0
    },
    last90Days: {
      totalRfqs: last90Stats.totalRfqs,
      averageValueCAD: last90Stats.totalRfqs > 0 
        ? last90Stats.totalValueCAD / last90Stats.totalRfqs 
        : 0,
      conversionRate: last90Stats.totalRfqs > 0 
        ? (last90Stats.convertedCount / last90Stats.totalRfqs) * 100 
        : 0
    },
    lastYear: {
      totalRfqs: yearStats.totalRfqs,
      averageValueCAD: yearStats.totalRfqs > 0 
        ? yearStats.totalValueCAD / yearStats.totalRfqs 
        : 0,
      conversionRate: yearStats.totalRfqs > 0 
        ? (yearStats.convertedCount / yearStats.totalRfqs) * 100 
        : 0
    }
  };
}

// Helper function to calculate status distribution
async function calculateStatusDistribution() {
  const statuses = ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED'];
  const distribution: Record<string, number> = {};
  
  // Get counts for each status
  const statusCounts = await db.execute(sql`
    SELECT 
      status, 
      COUNT(*) as count
    FROM 
      rfqs
    GROUP BY 
      status
  `);
  
  // Initialize all statuses with 0
  statuses.forEach(status => {
    distribution[status] = 0;
  });
  
  // Update with actual counts
  statusCounts.forEach((row: any) => {
    distribution[row.status] = parseInt(row.count);
  });
  
  return distribution;
}

// Helper function to calculate monthly trends
async function calculateMonthlyTrends(currentMonth: number, currentYear: number) {
  const trends = [];
  
  // Generate data for the last 12 months
  for (let i = 0; i < 12; i++) {
    const month = (currentMonth - i + 12) % 12; // Ensure month is 0-11
    const year = currentYear - Math.floor((i - currentMonth) / 12);
    
    const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'short' });
    
    // Calculate first and last day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Format dates as ISO strings for SQL
    const firstDayISO = firstDay.toISOString();
    const lastDayISO = lastDay.toISOString();
    
    // Get RFQ stats for this month
    const monthStats = await db
      .select({
        totalRfqs: count(),
        accepted: sql<number>`COUNT(CASE WHEN status IN ('APPROVED', 'COMPLETED') THEN 1 END)`,
        declined: sql<number>`COUNT(CASE WHEN status = 'REJECTED' THEN 1 END)`,
        totalValueCAD: sql<number>`COALESCE(SUM(total_budget), 0)`
      })
      .from(rfqs)
      .where(
        sql`created_at >= ${firstDayISO} AND created_at <= ${lastDayISO}`
      );
    
    const stats = monthStats[0] || { totalRfqs: 0, accepted: 0, declined: 0, totalValueCAD: 0 };
    
    // Add month data to trends
    trends.push({
      month: monthName,
      year,
      totalRfqs: stats.totalRfqs,
      accepted: stats.accepted,
      declined: stats.declined,
      totalValueCAD: stats.totalValueCAD
    });
  }
  
  // Reverse to get chronological order
  return trends.reverse();
}