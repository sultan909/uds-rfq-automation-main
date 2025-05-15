import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { rfqs, rfqItems } from '../../../../db/schema';
import { count, like } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.customerId) {
      throw new ApiError('Customer ID is required');
    }
    
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      throw new ApiError('At least one item is required');
    }

    // Generate RFQ number if not provided
    if (!body.rfqNumber) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const rfqCount = await db
        .select({ value: count() })
        .from(rfqs)
        .where(like(rfqs.rfqNumber, `RFQ-${year}${month}-%`))
        .then(result => result[0].value);
      
      body.rfqNumber = `RFQ-${year}${month}-${(rfqCount + 1).toString().padStart(4, '0')}`;
    }
    
    // Create RFQ with default requestorId (1)
    const [newRfq] = await db
      .insert(rfqs)
      .values({
        rfqNumber: body.rfqNumber,
        title: body.title,
        description: body.description,
        requestorId: 1, // Default requestor ID
        customerId: parseInt(body.customerId),
        vendorId: body.vendorId,
        status: body.status || 'PENDING',
        dueDate: body.dueDate ? new Date(body.dueDate).toISOString() : null,
        attachments: body.attachments,
        totalBudget: body.totalBudget ? parseFloat(body.totalBudget) : null,
        source: body.source || 'MANUAL',
        notes: body.notes
      })
      .returning();

    // Create RFQ items
    const rfqItemsData = body.items.map((item: any) => ({
      rfqId: newRfq.id,
      name: item.customerSku, // Using customerSku as the name since it's required
      customerSku: item.customerSku,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit || 'EA',
      estimatedPrice: item.estimatedPrice,
      inventoryId: item.inventoryId
    }));

    await db.insert(rfqItems).values(rfqItemsData);
    
    // Return response
    return NextResponse.json(
      createSuccessResponse(newRfq),
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
} 