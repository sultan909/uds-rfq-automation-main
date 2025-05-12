// app/api/inventory/[id]/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { InventoryService, RfqService, CustomerService } from '../../../lib/mock-db/service';
import { createSuccessResponse } from '../../../lib/api-response';
import { handleApiError, ApiError } from '../../../lib/error-handler';

interface RouteParams {
  params: {
    id: string; // Inventory Item ID
  };
}

/**
 * GET /api/inventory/:id/history
 * Get sales history for a specific inventory item
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;

    // Extract filter parameters
    const period = searchParams.get('period') || 'all'; // e.g., all, 3months, 6months, 12months

    // Get inventory item
    const item = InventoryService.getById(id);
    if (!item) {
      throw new ApiError(`Inventory item with ID ${id} not found`, 404);
    }
    const targetSku = item.sku;

    // Get all completed RFQs
    const completedRfqs = RfqService.getAll().filter(rfq =>
      ['accepted', 'processed'].includes(rfq.status)
    );

    // Filter RFQs that contain the target SKU
    let salesHistoryRfqs = completedRfqs.filter(rfq =>
      rfq.items.some(rfqItem => rfqItem.sku === targetSku)
    );

    // Filter by period if needed
    if (period !== 'all') {
      const now = new Date();
      let monthsBack = 0;

      if (period === '3months') monthsBack = 3;
      else if (period === '6months') monthsBack = 6;
      else if (period === '12months') monthsBack = 12;

      if (monthsBack > 0) {
        const cutoffDate = new Date(now);
        cutoffDate.setMonth(now.getMonth() - monthsBack);
        salesHistoryRfqs = salesHistoryRfqs.filter(rfq => new Date(rfq.date) >= cutoffDate);
      }
    }

    // Sort by date, newest first
    salesHistoryRfqs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Prepare response data
    const historyItems = salesHistoryRfqs.map(rfq => {
      const relevantItem = rfq.items.find(i => i.sku === targetSku);
      const customer = CustomerService.getById(rfq.customerId);
      return {
        rfqId: rfq.id,
        rfqNumber: rfq.rfqNumber,
        date: rfq.date,
        customerId: rfq.customerId,
        customerName: customer?.name || 'Unknown Customer',
        quantity: relevantItem?.quantity || 0,
        unitPrice: relevantItem?.price || 0,
        total: (relevantItem?.quantity || 0) * (relevantItem?.price || 0)
      };
    }).filter(item => item.quantity > 0); // Ensure we only include actual sales of the item

    // Calculate summary metrics
    const totalQuantitySold = historyItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalRevenue = historyItems.reduce((sum, item) => sum + item.total, 0);
    const averagePrice = totalQuantitySold > 0
      ? historyItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) / totalQuantitySold
      : 0;

    const response = {
      itemId: id,
      sku: targetSku,
      description: item.description,
      history: historyItems,
      summary: {
        totalSalesRecords: historyItems.length,
        totalQuantitySold,
        totalRevenue,
        averagePrice: parseFloat(averagePrice.toFixed(2)),
        currency: 'CAD' // Assuming CAD for now
      }
    };

    // Return response
    return NextResponse.json(createSuccessResponse(response));
  } catch (error) {
    return handleApiError(error);
  }
}