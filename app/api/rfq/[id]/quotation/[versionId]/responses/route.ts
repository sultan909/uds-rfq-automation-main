import { NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  quotationResponses, 
  quotationResponseItems,
  quotationVersions
} from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { CreateQuotationResponseRequest } from '@/lib/types/quotation-response';

export async function GET(
  request: Request,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const rfqId = parseInt(await params.id);
    const versionId = parseInt(await params.versionId);

    // Verify version exists and belongs to the RFQ
    const version = await db.query.quotationVersions.findFirst({
      where: eq(quotationVersions.id, versionId),
    });

    if (!version || version.rfqId !== rfqId) {
      return NextResponse.json(
        { success: false, error: 'Quotation version not found' },
        { status: 404 }
      );
    }

    // Get all responses for this version
    const responses = await db.query.quotationResponses.findMany({
      where: eq(quotationResponses.quotationVersionId, versionId),
      orderBy: [desc(quotationResponses.responseNumber)],
      with: {
        recordedByUser: {
          columns: {
            id: true,
            name: true,
            email: true,
          }
        },
        responseItems: {
          with: {
            sku: {
              columns: {
                id: true,
                sku: true,
                description: true,
                mpn: true,
                brand: true,
              }
            },
            quotationVersionItem: {
              columns: {
                id: true,
                quantity: true,
                unitPrice: true,
                totalPrice: true,
                comment: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: responses,
    });
  } catch (error) {
    console.error('Error fetching quotation responses:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch quotation responses',
      },
      { status: 500 }
    );
  }
}


export async function POST(
  request: Request,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const rfqId = parseInt(params.id);
    const versionId = parseInt(params.versionId);
    const body: CreateQuotationResponseRequest = await request.json();

    // Verify version exists and belongs to the RFQ
    const version = await db.query.quotationVersions.findFirst({
      where: eq(quotationVersions.id, versionId),
    });

    if (!version || version.rfqId !== rfqId) {
      return NextResponse.json(
        { success: false, error: 'Quotation version not found' },
        { status: 404 }
      );
    }

    // Validate request body
    if (!body.overallStatus || !body.responseDate || !body.responseItems?.length) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the next response number
    const latestResponse = await db.query.quotationResponses.findFirst({
      where: eq(quotationResponses.quotationVersionId, versionId),
      orderBy: [desc(quotationResponses.responseNumber)],
    });

    const responseNumber = (latestResponse?.responseNumber || 0) + 1;

    // Create the response record
    const [newResponse] = await db.insert(quotationResponses).values({
      quotationVersionId: versionId,
      responseNumber,
      overallStatus: body.overallStatus,
      responseDate: new Date(body.responseDate),
      customerContactPerson: body.customerContactPerson || null,
      communicationMethod: body.communicationMethod,
      overallComments: body.overallComments || null,
      requestedDeliveryDate: body.requestedDeliveryDate || null,
      paymentTermsRequested: body.paymentTermsRequested || null,
      specialInstructions: body.specialInstructions || null,
      recordedByUserId: 1, // TODO: Get from auth context
    }).returning();

    // Create response items
    if (body.responseItems && body.responseItems.length > 0) {
      const responseItemsData = body.responseItems.map(item => ({
        quotationResponseId: newResponse.id,
        quotationVersionItemId: item.quotationVersionItemId,
        skuId: item.skuId,
        itemStatus: item.itemStatus,
        requestedQuantity: item.requestedQuantity,
        requestedUnitPrice: item.requestedUnitPrice,
        requestedTotalPrice: item.requestedQuantity && item.requestedUnitPrice 
          ? item.requestedQuantity * item.requestedUnitPrice 
          : undefined,
        customerSkuReference: item.customerSkuReference,
        itemSpecificComments: item.itemSpecificComments,
        alternativeSuggestions: item.alternativeSuggestions,
        deliveryRequirements: item.deliveryRequirements,
      }));

      await db.insert(quotationResponseItems).values(responseItemsData);
    }

    // Fetch the complete response with items for the response
    const completeResponse = await db.query.quotationResponses.findFirst({
      where: eq(quotationResponses.id, newResponse.id),
      with: {
        recordedByUser: {
          columns: {
            id: true,
            name: true,
            email: true,
          }
        },
        responseItems: {
          with: {
            sku: {
              columns: {
                id: true,
                sku: true,
                description: true,
                mpn: true,
                brand: true,
              }
            },
            quotationVersionItem: {
              columns: {
                id: true,
                quantity: true,
                unitPrice: true,
                totalPrice: true,
                comment: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: completeResponse,
    });
  } catch (error) {
    console.error('Error creating quotation response:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create quotation response',
      },
      { status: 500 }
    );
  }
}
