import { NextRequest, NextResponse } from 'next/server';
import { CustomerService, RfqService } from '../../../lib/mock-db/service';
import { createSuccessResponse } from '../../../lib/api-response';
import { handleApiError, ApiError } from '../../../lib/error-handler';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/customers/:id/history
 * Get RFQ history for a specific customer
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    
    // Extract filter parameters
    const period = searchParams.get('period') || 'all'; // all, 3months, 6months, 12months
    
    // Check if customer exists
    const customer = CustomerService.getById(id);
    if (!customer) {
      throw new ApiError(`Customer with ID ${id} not found`, 404);
    }
    
    // Get all RFQs for the customer
    const allRfqs = RfqService.getAll({ customerId: id });
    
    // Filter by period if needed
    let filteredRfqs = [...allRfqs];
    
    if (period !== 'all') {
      const now = new Date();
      let monthsBack = 0;
      
      if (period === '3months') monthsBack = 3;
      else if (period === '6months') monthsBack = 6;
      else if (period === '12months') monthsBack = 12;
      
      const cutoffDate = new Date(now);
      cutoffDate.setMonth(now.getMonth() - monthsBack);
      
      filteredRfqs = filteredRfqs.filter(rfq => new Date(rfq.date) >= cutoffDate);
    }
    
    // Sort by date, newest first
    filteredRfqs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Prepare response data
    const historyItems = filteredRfqs.map(rfq => ({
      rfqId: rfq.id,
      rfqNumber: rfq.rfqNumber,
      date: rfq.date,
      status: rfq.status,
      totalCAD: rfq.totalCAD,
      items: rfq.items.map(item => ({
        sku: item.sku,
        description: item.description,
        quantity: item.quantity,
        price: item.price
      }))
    }));
    
    const response = {
      customerId: id,
      customerName: customer.name,
      history: historyItems,
      totalRfqs: historyItems.length,
      metrics: {
        totalSpentCAD: historyItems.reduce((sum, item) => sum + (item.status === 'processed' ? item.totalCAD : 0), 0),
        averageOrderValueCAD: historyItems.length > 0 
          ? historyItems.reduce((sum, item) => sum + item.totalCAD, 0) / historyItems.length 
          : 0,
        acceptanceRate: historyItems.length > 0
          ? historyItems.filter(item => ['accepted', 'processed'].includes(item.status)).length / historyItems.length
          : 0
      }
    };
    
    // Return response
    return NextResponse.json(createSuccessResponse(response));
  } catch (error) {
    return handleApiError(error);
  }
}