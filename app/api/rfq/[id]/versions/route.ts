import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quotationVersions, customerResponses, quotationVersionItems, inventoryItems } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { CreateQuotationRequest } from '@/lib/types/quotation';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const versions = await db.query.quotationVersions.findMany({
      where: eq(quotationVersions.rfqId, parseInt(params.id)),
      orderBy: [desc(quotationVersions.versionNumber)],
      with: {
        responses: true,
        quotationResponses: {
          columns: {
            id: true,
            // Just getting the ID to count them, not the full data
          }
        },
        items: {
          with: {
            sku: {
              columns: {
                id: true,
                sku: true,
                description: true,
                mpn: true,
                brand: true,
              }
            }
          }
        },
        submittedByUser: {
          columns: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
    });

    // Add quotation response count to each version
    const versionsWithCounts = versions.map(version => ({
      ...version,
      quotationResponseCount: version.quotationResponses?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      data: versionsWithCounts,
    });
  } catch (error) {
    console.error('Error fetching quotation versions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch quotation versions',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body: CreateQuotationRequest = await request.json();
    const { entryType, notes, items } = body;

    const rfqId = parseInt(params.id);

    // Get the latest version number
    const latestVersion = await db.query.quotationVersions.findFirst({
      where: eq(quotationVersions.rfqId, rfqId),
      orderBy: [desc(quotationVersions.versionNumber)],
    });

    // Calculate total prices
    const totalEstimatedPrice = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalFinalPrice = totalEstimatedPrice; // Can be adjusted later

    // Create the new version
    const [newVersion] = await db.insert(quotationVersions).values({
      rfqId,
      versionNumber: (latestVersion?.versionNumber || 0) + 1,
      entryType,
      status: 'NEW',
      estimatedPrice: totalEstimatedPrice,
      finalPrice: totalFinalPrice,
      changes: '', // Will be calculated based on item differences
      notes,
      createdBy: 'System', // TODO: Get from auth context
      submittedByUserId: null, // TODO: Get from auth context
    }).returning();

    // Insert quotation items
    if (items.length > 0) {
      const quotationItemsData = items.map(item => ({
        versionId: newVersion.id,
        skuId: item.skuId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        comment: item.comment || null,
      }));

      await db.insert(quotationVersionItems).values(quotationItemsData);
    }

    // Update RFQ status if needed
    if (entryType === 'internal_quote') {
      // Update RFQ status to NEGOTIATING if it was SENT
      await db.execute(`
        UPDATE rfqs 
        SET status = CASE 
          WHEN status = 'SENT' THEN 'NEGOTIATING'
          ELSE status 
        END,
        current_version_id = ${newVersion.id}
        WHERE id = ${rfqId}
      `);
    }

    // Fetch the complete version with items for response
    const completeVersion = await db.query.quotationVersions.findFirst({
      where: eq(quotationVersions.id, newVersion.id),
      with: {
        items: {
          with: {
            sku: {
              columns: {
                id: true,
                sku: true,
                description: true,
                mpn: true,
                brand: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: completeVersion,
    });
  } catch (error) {
    console.error('Error creating quotation version:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create quotation version',
      },
      { status: 500 }
    );
  }
} 