import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rfqs, rfqItems, inventoryItems, auditLog } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

interface CreateRfqRequest {
  customerId: number;
  source: string;
  notes?: string;
  items: Array<{
    sku: string;
    description: string;
    quantity: number;
    price?: number | null;
    unit?: string;
  }>;
  currency: 'CAD' | 'USD';
  title?: string;
  dueDate?: string;
}

// Generate unique RFQ number
async function generateRfqNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RFQ-${year}`;
  
  // Find the latest RFQ number for this year
  const latestRfqs = await db
    .select({ rfqNumber: rfqs.rfqNumber })
    .from(rfqs)
    .where(sql`${rfqs.rfqNumber} LIKE ${prefix + '-%'}`)
    .orderBy(sql`${rfqs.rfqNumber} DESC`)
    .limit(1);

  let nextNumber = 1;
  if (latestRfqs.length > 0) {
    const lastNumber = latestRfqs[0].rfqNumber.split('-').pop();
    nextNumber = lastNumber ? parseInt(lastNumber) + 1 : 1;
  }

  return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateRfqRequest = await request.json();
    
    // Validate required fields
    if (!body.customerId || !body.source || !body.items || body.items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: customerId, source, and items are required'
      }, { status: 400 });
    }

    // Validate items
    for (const item of body.items) {
      if (!item.sku || !item.description || !item.quantity || item.quantity <= 0) {
        return NextResponse.json({
          success: false,
          error: 'All items must have SKU, description, and valid quantity'
        }, { status: 400 });
      }
    }

    // Generate RFQ number
    const rfqNumber = await generateRfqNumber();

    // Create RFQ title if not provided
    const title = body.title || `RFQ for ${body.items.length} item${body.items.length > 1 ? 's' : ''}`;

    // For now, we'll use a default user ID of 1 (should be from session/auth)
    const requestorId = 1; // TODO: Get from authenticated session

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Create the RFQ
      const [newRfq] = await tx.insert(rfqs).values({
        rfqNumber,
        title,
        description: body.notes || title,
        requestorId,
        customerId: body.customerId,
        status: 'NEW',
        source: body.source,
        notes: body.notes,
        dueDate: body.dueDate || null,
        totalBudget: null, // Will be calculated from items if prices provided
      }).returning();

      // Process items and find matching inventory
      const rfqItemsData = [];
      let totalBudget = 0;
      let hasPrices = false;

      for (const item of body.items) {
        // Try to find matching inventory item by SKU
        const [inventoryItem] = await tx
          .select()
          .from(inventoryItems)
          .where(eq(inventoryItems.sku, item.sku))
          .limit(1);

        // Calculate suggested price from inventory cost if available
        let suggestedPrice = null;
        let estimatedPrice = null;
        
        if (inventoryItem?.costCad) {
          // Apply a default markup of 30% for suggested price
          const cost = body.currency === 'USD' ? (inventoryItem.costUsd || inventoryItem.costCad * 0.75) : inventoryItem.costCad;
          suggestedPrice = Math.round(cost * 1.3 * 100) / 100;
          estimatedPrice = suggestedPrice;
        }

        // Use provided price or fallback to suggested price
        const finalPrice = item.price || suggestedPrice;
        
        if (finalPrice) {
          totalBudget += finalPrice * item.quantity;
          hasPrices = true;
        }

        rfqItemsData.push({
          rfqId: newRfq.id,
          name: item.sku,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || 'EA',
          customerSku: item.sku,
          internalProductId: inventoryItem?.id || null,
          suggestedPrice,
          finalPrice: item.price || null,
          currency: body.currency,
          status: 'PENDING',
          estimatedPrice,
        });
      }

      // Insert RFQ items
      await tx.insert(rfqItems).values(rfqItemsData);

      // Update total budget if we have prices
      if (hasPrices && totalBudget > 0) {
        await tx.update(rfqs)
          .set({ totalBudget })
          .where(eq(rfqs.id, newRfq.id));
      }

      // Create audit log entry
      await tx.insert(auditLog).values({
        userId: requestorId,
        action: 'RFQ_CREATED',
        entityType: 'RFQ',
        entityId: newRfq.id,
        details: {
          rfqNumber: newRfq.rfqNumber,
          customerId: body.customerId,
          source: body.source,
          itemCount: body.items.length,
          currency: body.currency,
          totalBudget: hasPrices ? totalBudget : null,
        }
      });

      return {
        rfq: newRfq,
        itemCount: body.items.length,
        totalBudget: hasPrices ? totalBudget : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.rfq.id,
        rfqNumber: result.rfq.rfqNumber,
        status: result.rfq.status,
        itemCount: result.itemCount,
        totalBudget: result.totalBudget,
      },
      message: `RFQ ${result.rfq.rfqNumber} created successfully`
    });

  } catch (error) {
    console.warn('Error creating RFQ:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return NextResponse.json({
          success: false,
          error: 'RFQ number already exists. Please try again.'
        }, { status: 409 });
      }
      
      if (error.message.includes('foreign key constraint')) {
        return NextResponse.json({
          success: false,
          error: 'Invalid customer ID or referenced data not found.'
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create RFQ'
    }, { status: 500 });
  }
} 