import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quotationResponses } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { responseId: string } }
) {
  try {
    const responseId = parseInt(params.responseId);
    const response = await db.query.quotationResponses.findFirst({
      where: eq(quotationResponses.id, responseId),
      with: {
        recordedByUser: {
          columns: { id: true, name: true, email: true }
        },
        responseItems: {
          with: {
            sku: {
              columns: { id: true, sku: true, description: true, mpn: true, brand: true }
            },
            quotationVersionItem: {
              columns: { id: true, quantity: true, unitPrice: true, totalPrice: true, comment: true }
            }
          }
        }
      }
    });

    if (!response) {
      return NextResponse.json(
        { success: false, error: 'Response not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error fetching quotation response:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quotation response' },
      { status: 500 }
    );
  }
}
