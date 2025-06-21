import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rfqs, rfqItems, inventoryItems, auditLog } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { createSuccessResponse, createErrorResponse } from '../lib/api-response';
import { handleApiError } from '../lib/error-handler';
import { withFullProtection } from '@/lib/csrf-protection';
import { RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter';

// Validation schema for RFQ creation
const createRfqSchema = z.object({
  customerId: z.number().positive('Customer ID must be positive'),
  source: z.string().min(1, 'Source is required'),
  notes: z.string().optional(),
  items: z.array(z.object({
    sku: z.string().min(1, 'SKU is required'),
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().positive('Quantity must be positive'),
    unitPrice: z.number().nonnegative().optional(),
    unit: z.string().optional(),
  })).min(1, 'At least one item is required'),
  currency: z.enum(['CAD', 'USD'], { errorMap: () => ({ message: 'Currency must be CAD or USD' }) }),
  title: z.string().optional(),
  dueDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }).optional(),
});

type CreateRfqRequest = z.infer<typeof createRfqSchema>;

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

export const POST = withFullProtection(async (request: NextRequest, context: any, user) => {
  try {
    const bodyData = await request.json();
    
    // Validate input using Zod schema
    const validation = createRfqSchema.safeParse(bodyData);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', validation.error.errors),
        { status: 400 }
      );
    }
    
    const body = validation.data;

    // Generate RFQ number
    const rfqNumber = await generateRfqNumber();

    // Create RFQ title if not provided
    const title = body.title || `RFQ for ${body.items.length} item${body.items.length > 1 ? 's' : ''}`;

    // Use authenticated user ID
    const requestorId = user.id;

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

        // Calculate suggested unit price from inventory cost if available and no price provided
        let unitPrice = item.unitPrice;
        
        if (!unitPrice && inventoryItem?.cost) {
          // Apply a default markup of 30% for suggested price
          // Convert cost to the requested currency if needed
          let cost = inventoryItem.cost;
          if (inventoryItem.costCurrency !== body.currency) {
            // Simple conversion rate for demo (should use actual rate)
            cost = inventoryItem.costCurrency === 'CAD' && body.currency === 'USD' 
              ? cost * 0.75 
              : cost * 1.35;
          }
          unitPrice = Math.round(cost * 1.3 * 100) / 100;
        }
        
        if (unitPrice) {
          totalBudget += unitPrice * item.quantity;
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
          unitPrice,
          currency: body.currency,
          status: 'PENDING',
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

    return NextResponse.json(
      createSuccessResponse({
        id: result.rfq.id,
        rfqNumber: result.rfq.rfqNumber,
        status: result.rfq.status,
        itemCount: result.itemCount,
        totalBudget: result.totalBudget,
      }, `RFQ ${result.rfq.rfqNumber} created successfully`),
      { status: 201 }
    );

  } catch (error) {
    return handleApiError(error);
  }
}, {
  rateLimit: RATE_LIMIT_CONFIGS.WRITE,
  csrf: { methods: ['POST'] }
}); 