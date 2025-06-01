import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../../lib/api-response';
import { handleApiError, ApiError } from '../../../lib/error-handler';
import { db } from '../../../../../db';
import { quotations, rfqs, vendors, quotationVersions, salesHistory } from '../../../../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/rfq/:id/quote
 * Get quote for a specific RFQ
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Get quote with vendor data
    const quote = await db
      .select({
        quote: quotations,
        vendor: {
          id: vendors.id,
          name: vendors.name,
          email: vendors.email,
          phone: vendors.phone,
          address: vendors.address,
          contactPerson: vendors.contactPerson
        }
      })
      .from(quotations)
      .leftJoin(vendors, eq(quotations.vendorId, vendors.id))
      .where(eq(quotations.rfqId, parseInt(id)))
      .then(result => result[0]);

    if (!quote) {
      throw new ApiError(`Quote for RFQ ${id} not found`, 404);
    }

    // Transform the data to match the expected format
    const responseData = {
      ...quote.quote,
      vendor: quote.vendor
    };

    return NextResponse.json(createSuccessResponse(responseData));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/rfq/:id/quote
 * Create a quote for an RFQ
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Ensure params is properly awaited
    const rfqId = parseInt(params.id);
    if (isNaN(rfqId)) {
      throw new Error('Invalid RFQ ID');
    }

    const body = await request.json();
    const { amount, currency, validUntil, terms, notes, vendorId } = body;

    // Calculate total amount
    const totalAmount = amount || 0;

    // Format the validUntil date properly
    const validUntilDate = validUntil 
      ? new Date(validUntil).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Create the quotation
    const [newQuote] = await db.insert(quotations).values({
      quoteNumber: `Q-${nanoid(6)}`,
      rfqId,
      customerId: 1, // TODO: Get from RFQ
      vendorId: vendorId || 1, // Default to vendor 1 if not provided
      totalAmount,
      deliveryTime: '2 weeks', // Default delivery time
      validUntil: validUntilDate,
      termsAndConditions: terms || '',
      notes: notes || '',
      status: 'PENDING',
      createdBy: 1, // TODO: Get from session
    }).returning();

    // Get the latest version number
    const latestVersion = await db.query.quotationVersions.findFirst({
      where: eq(quotationVersions.rfqId, rfqId),
      orderBy: [desc(quotationVersions.versionNumber)],
    });

    // Create a new quotation version
    const [newVersion] = await db.insert(quotationVersions).values({
      rfqId,
      versionNumber: (latestVersion?.versionNumber || 0) + 1,
      status: 'NEW',
      estimatedPrice: totalAmount,
      finalPrice: totalAmount,
      changes: 'Initial quote created',
      createdBy: 'System', // TODO: Get from auth context
    }).returning();

    return NextResponse.json({
      success: true,
      data: {
        id: newQuote.id,
        rfqId: newQuote.rfqId,
        version: newVersion,
      },
    });
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create quote' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/rfq/:id/quote
 * Update a quote for an RFQ
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
console.log("body",body);

    // Check if quote exists
    const existingQuote = await db
      .select()
      .from(quotations)
      .where(eq(quotations.rfqId, parseInt(id)))
      .then(result => result[0]);

    if (!existingQuote) {
      throw new ApiError(`Quote for RFQ ${id} not found`, 404);
    }

    // Update quote
    const [updatedQuote] = await db
      .update(quotations)
      .set({
        // @ts-ignore
        amount: body.amount,
        currency: body.currency,
        validUntil: body.validUntil ? new Date(body.validUntil).toISOString() : null,
        terms: body.terms,
        notes: body.notes,
        status: body.status
      })
      .where(eq(quotations.rfqId, parseInt(id)))
      .returning();

    // If status is updated to APPROVED or COMPLETED, create sales history entries
    if (body.status === 'APPROVED' || body.status === 'COMPLETED'|| body.status === 'ACCEPTED') {
      console.log('Creating sales history entries for RFQ', id);
      // Get the RFQ with its items
      const rfqWithItems = await db.query.rfqs.findFirst({
        where: eq(rfqs.id, parseInt(id)),
        with: {
          items: true,
          customer: true
        }
      });

      if (rfqWithItems && rfqWithItems.items && rfqWithItems.items.length > 0) {
        // Create sales history entries for each item
        const salesHistoryEntries = rfqWithItems.items.map(item => ({
          invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          customerId: rfqWithItems.customerId,
          // @ts-ignore
          productId: item.inventoryItemId || 1, // Default to 1 if not mapped
          quantity: item.quantity,
          // @ts-ignore

          unitPrice: item.unitPrice || 0,
          // @ts-ignore

          extendedPrice: (item.quantity || 0) * (item.unitPrice || 0),
          // @ts-ignore
          currency: updatedQuote.currency || 'CAD',
          saleDate: new Date().toISOString().split('T')[0],
          quickbooksInvoiceId: `QB-${Date.now()}`
        }));

        // Insert sales history entries
        await db.insert(salesHistory).values(salesHistoryEntries);
      }
    }

    return NextResponse.json(createSuccessResponse(updatedQuote));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/rfq/:id/quote
 * Delete a quote for an RFQ
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Check if quote exists
    const existingQuote = await db
      .select()
      .from(quotations)
      .where(eq(quotations.rfqId, parseInt(id)))
      .then(result => result[0]);

    if (!existingQuote) {
      throw new ApiError(`Quote for RFQ ${id} not found`, 404);
    }

    // Delete quote
    await db
      .delete(quotations)
      .where(eq(quotations.rfqId, parseInt(id)));

    return NextResponse.json(
      createSuccessResponse({ message: `Quote for RFQ ${id} deleted successfully` })
    );
  } catch (error) {
    return handleApiError(error);
  }
}