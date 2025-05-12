import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';
import { RfqService, CustomerService, InventoryService } from '../../lib/mock-db/service';

/**
 * GET /api/dashboard/metrics
 * Get dashboard metrics
 */
export async function GET(request: NextRequest) {
  try {
    // Calculate various metrics based on the mock data
    
    // RFQ metrics
    const allRfqs = RfqService.getAll();
    const activeRfqs = allRfqs.filter(rfq => 
      ['new', 'draft', 'priced', 'sent', 'negotiating'].includes(rfq.status)
    );
    const completedRfqs = allRfqs.filter(rfq => 
      ['accepted', 'processed'].includes(rfq.status)
    );
    const declinedRfqs = allRfqs.filter(rfq => 
      rfq.status === 'declined'
    );
    
    // Customer metrics
    const allCustomers = CustomerService.getAll();
    const activeCustomers = allCustomers.filter(customer => 
      customer.totalOrders > 0
    );
    
    // Inventory metrics
    const allInventory = InventoryService.getAll();
    const lowStockItems = allInventory.filter(item => item.lowStock);
    const outOfStockItems = allInventory.filter(item => item.outOfStock);
    
    // Calculate sales data
    const totalSalesCAD = completedRfqs.reduce((sum, rfq) => sum + rfq.totalCAD, 0);
    
    // Get current date for comparison
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate);
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);
    
    // Calculate recent metrics
    const recentRfqs = allRfqs.filter(rfq => 
      new Date(rfq.createdAt) >= thirtyDaysAgo
    );
    const recentCompletedRfqs = completedRfqs.filter(rfq => 
      new Date(rfq.createdAt) >= thirtyDaysAgo
    );
    
    const recentSalesCAD = recentCompletedRfqs.reduce((sum, rfq) => sum + rfq.totalCAD, 0);
    
    // Calculate conversion rate
    const conversionRate = allRfqs.length > 0 
      ? (completedRfqs.length / allRfqs.length) * 100 
      : 0;
    
    // Return metrics
    return NextResponse.json(createSuccessResponse({
      rfqMetrics: {
        totalRfqs: allRfqs.length,
        activeRfqs: activeRfqs.length,
        completedRfqs: completedRfqs.length,
        declinedRfqs: declinedRfqs.length,
        conversionRate
      },
      customerMetrics: {
        totalCustomers: allCustomers.length,
        activeCustomers: activeCustomers.length
      },
      inventoryMetrics: {
        totalItems: allInventory.length,
        lowStockItems: lowStockItems.length,
        outOfStockItems: outOfStockItems.length
      },
      salesMetrics: {
        totalSalesCAD,
        recentSalesCAD,
        currency: 'CAD'
      },
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    return handleApiError(error);
  }
}