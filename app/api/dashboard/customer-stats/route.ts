import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';
import { CustomerService, RfqService } from '../../lib/mock-db/service';

/**
 * GET /api/dashboard/customer-stats
 * Get customer statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get all customers
    const allCustomers = CustomerService.getAll();
    
    // Get all RFQs
    const allRfqs = RfqService.getAll();
    
    // Calculate customer type distribution
    const customerTypeDistribution = {
      Dealer: allCustomers.filter(customer => customer.type === 'Dealer').length,
      Wholesaler: allCustomers.filter(customer => customer.type === 'Wholesaler').length
    };
    
    // Calculate RFQ distribution by customer type
    const rfqsByCustomerType = calculateRfqsByCustomerType(allRfqs, allCustomers);
    
    // Calculate top customers by sales volume
    const topCustomers = calculateTopCustomers(allRfqs, allCustomers);
    
    // Calculate customer retention metrics
    const retentionMetrics = calculateRetentionMetrics(allRfqs, allCustomers);
    
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
function calculateRfqsByCustomerType(rfqs: any[], customers: any[]) {
  const distribution = {
    Dealer: {
      totalRfqs: 0,
      totalValueCAD: 0,
      conversionRate: 0
    },
    Wholesaler: {
      totalRfqs: 0,
      totalValueCAD: 0,
      conversionRate: 0
    }
  };
  
  // Process each RFQ
  rfqs.forEach(rfq => {
    const customer = customers.find(c => c.id === rfq.customerId);
    if (customer) {
      const type = customer.type as 'Dealer' | 'Wholesaler';
      
      distribution[type].totalRfqs += 1;
      distribution[type].totalValueCAD += rfq.totalCAD;
      
      // Increment converted count if the RFQ was accepted or processed
      if (['accepted', 'processed'].includes(rfq.status)) {
        distribution[type].conversionRate += 1;
      }
    }
  });
  
  // Calculate conversion rates
  if (distribution.Dealer.totalRfqs > 0) {
    distribution.Dealer.conversionRate = 
      (distribution.Dealer.conversionRate / distribution.Dealer.totalRfqs) * 100;
  }
  
  if (distribution.Wholesaler.totalRfqs > 0) {
    distribution.Wholesaler.conversionRate = 
      (distribution.Wholesaler.conversionRate / distribution.Wholesaler.totalRfqs) * 100;
  }
  
  return distribution;
}

// Helper function to calculate top customers by sales volume
function calculateTopCustomers(rfqs: any[], customers: any[]) {
  // Create a map to store sales data for each customer
  const customerSales: Record<string, { 
    id: string, 
    name: string, 
    type: string,
    rfqCount: number,
    acceptedRfqCount: number,
    totalSpentCAD: number
  }> = {};
  
  // Initialize with all customers
  customers.forEach(customer => {
    customerSales[customer.id] = {
      id: customer.id,
      name: customer.name,
      type: customer.type,
      rfqCount: 0,
      acceptedRfqCount: 0,
      totalSpentCAD: 0
    };
  });
  
  // Process each RFQ
  rfqs.forEach(rfq => {
    if (customerSales[rfq.customerId]) {
      customerSales[rfq.customerId].rfqCount += 1;
      
      if (['accepted', 'processed'].includes(rfq.status)) {
        customerSales[rfq.customerId].acceptedRfqCount += 1;
        customerSales[rfq.customerId].totalSpentCAD += rfq.totalCAD;
      }
    }
  });
  
  // Convert to array and sort by total spent
  const sortedCustomers = Object.values(customerSales)
    .sort((a, b) => b.totalSpentCAD - a.totalSpentCAD);
  
  // Return top 10 customers
  return sortedCustomers.slice(0, 10);
}

// Helper function to calculate customer retention metrics
function calculateRetentionMetrics(rfqs: any[], customers: any[]) {
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
  const activeLastMonth = new Set<string>();
  const activeLastThreeMonths = new Set<string>();
  const activeLastSixMonths = new Set<string>();
  
  // Process each RFQ
  rfqs.forEach(rfq => {
    const rfqDate = new Date(rfq.createdAt);
    
    if (rfqDate >= oneMonthAgo) {
      activeLastMonth.add(rfq.customerId);
    }
    
    if (rfqDate >= threeMonthsAgo) {
      activeLastThreeMonths.add(rfq.customerId);
    }
    
    if (rfqDate >= sixMonthsAgo) {
      activeLastSixMonths.add(rfq.customerId);
    }
  });
  
  return {
    activeLastMonth: activeLastMonth.size,
    activeLastThreeMonths: activeLastThreeMonths.size,
    activeLastSixMonths: activeLastSixMonths.size,
    retentionRate: {
      oneMonth: (activeLastMonth.size / customers.length) * 100,
      threeMonths: (activeLastThreeMonths.size / customers.length) * 100,
      sixMonths: (activeLastSixMonths.size / customers.length) * 100
    }
  };
}