import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';
import { RfqService } from '../../lib/mock-db/service';

/**
 * GET /api/dashboard/rfq-stats
 * Get RFQ statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get all RFQs
    const allRfqs = RfqService.getAll();
    
    // Get current date for time-based filtering
    const currentDate = new Date();
    
    // Calculate stats for different time periods
    const stats = calculateStats(allRfqs, currentDate);
    
    // Calculate status distribution
    const statusDistribution = calculateStatusDistribution(allRfqs);
    
    // Get current month and year
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Calculate monthly trends
    const monthlyTrends = calculateMonthlyTrends(allRfqs, currentMonth, currentYear);
    
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
function calculateStats(rfqs: any[], currentDate: Date) {
  const thirtyDaysAgo = new Date(currentDate);
  thirtyDaysAgo.setDate(currentDate.getDate() - 30);
  
  const ninetyDaysAgo = new Date(currentDate);
  ninetyDaysAgo.setDate(currentDate.getDate() - 90);
  
  const oneYearAgo = new Date(currentDate);
  oneYearAgo.setFullYear(currentDate.getFullYear() - 1);
  
  const last30Days = rfqs.filter(rfq => new Date(rfq.createdAt) >= thirtyDaysAgo);
  const last90Days = rfqs.filter(rfq => new Date(rfq.createdAt) >= ninetyDaysAgo);
  const lastYear = rfqs.filter(rfq => new Date(rfq.createdAt) >= oneYearAgo);
  
  return {
    last30Days: {
      totalRfqs: last30Days.length,
      averageValueCAD: last30Days.length > 0 
        ? last30Days.reduce((sum, rfq) => sum + rfq.totalCAD, 0) / last30Days.length 
        : 0,
      conversionRate: last30Days.length > 0 
        ? (last30Days.filter(rfq => ['accepted', 'processed'].includes(rfq.status)).length / last30Days.length) * 100 
        : 0
    },
    last90Days: {
      totalRfqs: last90Days.length,
      averageValueCAD: last90Days.length > 0 
        ? last90Days.reduce((sum, rfq) => sum + rfq.totalCAD, 0) / last90Days.length 
        : 0,
      conversionRate: last90Days.length > 0 
        ? (last90Days.filter(rfq => ['accepted', 'processed'].includes(rfq.status)).length / last90Days.length) * 100 
        : 0
    },
    lastYear: {
      totalRfqs: lastYear.length,
      averageValueCAD: lastYear.length > 0 
        ? lastYear.reduce((sum, rfq) => sum + rfq.totalCAD, 0) / lastYear.length 
        : 0,
      conversionRate: lastYear.length > 0 
        ? (lastYear.filter(rfq => ['accepted', 'processed'].includes(rfq.status)).length / lastYear.length) * 100 
        : 0
    }
  };
}

// Helper function to calculate status distribution
function calculateStatusDistribution(rfqs: any[]) {
  const statuses = ['new', 'draft', 'priced', 'sent', 'negotiating', 'accepted', 'declined', 'processed'];
  const distribution: Record<string, number> = {};
  
  statuses.forEach(status => {
    distribution[status] = rfqs.filter(rfq => rfq.status === status).length;
  });
  
  return distribution;
}

// Helper function to calculate monthly trends
function calculateMonthlyTrends(rfqs: any[], currentMonth: number, currentYear: number) {
  const trends = [];
  
  // Generate data for the last 12 months
  for (let i = 0; i < 12; i++) {
    const month = (currentMonth - i + 12) % 12; // Ensure month is 0-11
    const year = currentYear - Math.floor((i - currentMonth) / 12);
    
    const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'short' });
    
    // Filter RFQs for this month
    const monthRfqs = rfqs.filter(rfq => {
      const rfqDate = new Date(rfq.createdAt);
      return rfqDate.getMonth() === month && rfqDate.getFullYear() === year;
    });
    
    // Calculate stats for this month
    trends.push({
      month: monthName,
      year,
      totalRfqs: monthRfqs.length,
      accepted: monthRfqs.filter(rfq => ['accepted', 'processed'].includes(rfq.status)).length,
      declined: monthRfqs.filter(rfq => rfq.status === 'declined').length,
      totalValueCAD: monthRfqs.reduce((sum, rfq) => sum + rfq.totalCAD, 0)
    });
  }
  
  // Reverse to get chronological order
  return trends.reverse();
}