import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../../lib/api-response';
import { handleApiError, ApiError } from '../../../lib/error-handler';
import { db } from '../../../../../db';
import { quotations, rfqs, vendors } from '../../../../../db/schema';
import { eq, and } from 'drizzle-orm';

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
    const { id } = params;
    const body = await request.json();
    
    // Validate required fields
    if (!body.vendorId) {
      throw new ApiError('Vendor ID is required');
    }

    // Check if RFQ exists
    const rfq = await db
      .select()
      .from(rfqs)
      .where(eq(rfqs.id, parseInt(id)))
      .then(result => result[0]);

    if (!rfq) {
      throw new ApiError(`RFQ with ID ${id} not found`, 404);
    }

    // Create quote
    const [newQuote] = await db
      .insert(quotations)
      // @ts-ignore
      .values({
        rfqId: parseInt(id),
        vendorId: body.vendorId,
        amount: body.amount,
        currency: body.currency,
        validUntil: body.validUntil ? new Date(body.validUntil).toISOString() : null,
        terms: body.terms,
        notes: body.notes,
        status: body.status || 'PENDING'
      })
      .returning();

    return NextResponse.json(
      createSuccessResponse(newQuote),
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
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