import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../../lib/api-response';
import { handleApiError, ApiError } from '../../../lib/error-handler';
import { RfqService, CustomerService } from '../../../lib/mock-db/service';

/**
 * POST /api/integrations/quickbooks/push-estimate
 * Push RFQ as an estimate to QuickBooks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.rfqId) {
      throw new ApiError('RFQ ID is required', 400);
    }
    
    // Get the RFQ
    const rfq = RfqService.getById(body.rfqId);
    
    if (!rfq) {
      throw new ApiError(`RFQ with ID ${body.rfqId} not found`, 404);
    }
    
    // Get the customer
    const customer = CustomerService.getById(rfq.customerId);
    
    if (!customer) {
      throw new ApiError(`Customer with ID ${rfq.customerId} not found`, 404);
    }
    
    // In a real implementation, we would:
    // 1. Map the RFQ data to a QuickBooks estimate
    // 2. Send the estimate to QuickBooks
    // 3. Update the RFQ with the QuickBooks estimate ID
    
    // For the mock implementation, we'll simulate pushing an estimate
    
    // Simulate mapping RFQ to QuickBooks estimate
    const estimate = {
      id: `estimate-${Date.now()}`,
      customerRef: {
        value: customer.id,
        name: customer.name
      },
      txnDate: new Date().toISOString().split('T')[0],
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      line: rfq.items.map((item, index) => ({
        id: `${index + 1}`,
        lineNum: index + 1,
        description: item.description,
        amount: item.quantity * (item.price || 0),
        detailType: 'SalesItemLineDetail',
        salesItemLineDetail: {
          itemRef: {
            value: `item-${index + 1}`,
            name: item.description
          },
          unitPrice: item.price,
          quantity: item.quantity
        }
      })),
      totalAmt: rfq.totalCAD
    };
    
    // Simulate updating RFQ with QuickBooks estimate ID
    const updatedRfq = RfqService.update(rfq.id, {
      externalId: estimate.id,
      externalSystem: 'QuickBooks',
      lastSyncedAt: new Date().toISOString()
    });
    
    // Return success response with the estimate and updated RFQ
    return NextResponse.json(createSuccessResponse({
      estimate,
      rfq: updatedRfq,
      message: 'RFQ successfully pushed to QuickBooks as an estimate'
    }));
  } catch (error) {
    return handleApiError(error);
  }
}