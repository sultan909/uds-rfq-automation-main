import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../../lib/api-response';
import { handleApiError, ApiError } from '../../../lib/error-handler';
import { db } from '../../../../../db';
import { rfqs, customers, users, rfqItems, inventoryItems } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/rfq/:id/export
 * Export RFQ data in the requested format
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const format = request.nextUrl.searchParams.get('format') || 'pdf';
    
    // Get RFQ with related data
    const rfqData = await db
      .select({
        rfq: rfqs,
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          type: customers.type,
          phone: customers.phone,
          address: customers.address,
          contactPerson: customers.contactPerson
        },
        requestor: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role
        }
      })
      .from(rfqs)
      .leftJoin(customers, eq(rfqs.customerId, customers.id))
      .leftJoin(users, eq(rfqs.requestorId, users.id))
      .where(eq(rfqs.id, parseInt(id)))
      .then(result => result[0]);

    if (!rfqData) {
      throw new ApiError(`RFQ with ID ${id} not found`, 404);
    }

    // Get RFQ items with inventory data
    const items = await db
      .select({
        item: rfqItems,
        inventory: {
          id: inventoryItems.id,
          sku: inventoryItems.sku,
          description: inventoryItems.description,
          stock: inventoryItems.stock,
          cost: inventoryItems.cost,
          costCurrency: inventoryItems.costCurrency
        }
      })
      .from(rfqItems)
      .leftJoin(inventoryItems, eq(rfqItems.internalProductId, inventoryItems.id))
      .where(eq(rfqItems.rfqId, parseInt(id)));

    // Transform the data to match the expected format
    const exportData = {
      ...rfqData.rfq,
      customer: rfqData.customer,
      requestor: rfqData.requestor,
      items: items.map(item => ({
        ...item.item,
        inventory: item.inventory
      }))
    };

    // In a real application, we would generate the file based on the format
    // For now, we'll just return the data
    return NextResponse.json(createSuccessResponse({
      format,
      data: exportData,
      filename: `RFQ-${rfqData.rfq.rfqNumber}.${format}`
    }));
  } catch (error) {
    return handleApiError(error);
  }
}