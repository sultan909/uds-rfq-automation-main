import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../../lib/api-response';
import { handleApiError, ApiError } from '../../../lib/error-handler';
import { db } from '@/db';
import { customers, rfqs, rfqItems, inventoryItems } from '@/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

interface RouteParams {
  params: {
    id: string;
  };
}

type Customer = InferSelectModel<typeof customers>;
type RFQ = InferSelectModel<typeof rfqs>;
type RFQItem = InferSelectModel<typeof rfqItems>;
type InventoryItem = InferSelectModel<typeof inventoryItems>;

interface HistoryItem {
  rfqId: number;
  rfqNumber: string;
  date: Date;
  status: string;
  totalCAD: number;
  items: Array<{
    sku: string | null;
    description: string | null;
    quantity: number;
    price: number | null;
  }>;
}

/**
 * GET /api/customers/:id/history
 * Get RFQ history for a specific customer
 */
export async function GET(request: NextRequest, context: Promise<RouteParams>) {
  try {
    const { params } = await context;
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    
    // Extract filter parameters
    const period = searchParams.get('period') || 'all'; // all, 3months, 6months, 12months
    
    // Check if customer exists
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, parseInt(id)))
      .then((result: Customer[]) => result[0]);

    if (!customer) {
      throw new ApiError(`Customer with ID ${id} not found`, 404);
    }
    
    // Calculate cutoff date if period is specified
    let cutoffDate: Date | undefined;
    if (period !== 'all') {
      const now = new Date();
      let monthsBack = 0;
      
      if (period === '3months') monthsBack = 3;
      else if (period === '6months') monthsBack = 6;
      else if (period === '12months') monthsBack = 12;
      
      cutoffDate = new Date(now);
      cutoffDate.setMonth(now.getMonth() - monthsBack);
    }
    
    // Build query conditions
    const conditions = [eq(rfqs.customerId, parseInt(id))];
    if (cutoffDate) {
      conditions.push(gte(rfqs.createdAt, cutoffDate));
    }
    
    // Get RFQs with items and inventory data
    const rfqHistory = await db
      .select({
        rfq: rfqs,
        items: {
        // @ts-ignore
          item: rfqItems,
          inventory: {
            // @ts-ignore
            id: inventoryItems.id,
            sku: inventoryItems.sku,
            description: inventoryItems.description
          }
        }
      })
      .from(rfqs)
      .leftJoin(rfqItems, eq(rfqs.id, rfqItems.rfqId))
      .leftJoin(inventoryItems, eq(rfqItems.internalProductId, inventoryItems.id))
      .where(and(...conditions))
      .orderBy(desc(rfqs.createdAt));

    // Group items by RFQ
    interface GroupedHistoryItem {
      rfq: RFQ;
      items: Array<RFQItem & { inventory: Partial<InventoryItem> | null }>;
    }
            // @ts-ignore
    const groupedHistory = rfqHistory.reduce((acc: Record<number, GroupedHistoryItem>, curr: { rfq: RFQ; items: { item: RFQItem | null; inventory: Partial<InventoryItem> | null } }) => {
      const rfqId = curr.rfq.id;
      if (!acc[rfqId]) {
        acc[rfqId] = {
          rfq: curr.rfq,
          items: []
        };
      }
      if (curr.items.item) {
        acc[rfqId].items.push({
          ...curr.items.item,
          inventory: curr.items.inventory
        });
      }
      return acc;
    }, {});

    // Transform data for response
    const historyItems: HistoryItem[] = (Object.values(groupedHistory) as GroupedHistoryItem[]).map(({ rfq, items }) => ({
      rfqId: rfq.id,
      rfqNumber: rfq.rfqNumber,
      date: rfq.createdAt,
      status: rfq.status,
      totalCAD: items.reduce((sum: number, item: RFQItem) => sum + (item.finalPrice || 0), 0),
      items: items.map((item: RFQItem & { inventory: Partial<InventoryItem> | null }) => ({
        sku: item.inventory?.sku || null,
        description: item.description || item.inventory?.description || null,
        quantity: item.quantity,
        price: item.finalPrice || item.suggestedPrice
      }))
    }));

    // Calculate metrics
    const processedRfqs = historyItems.filter(item => item.status === 'COMPLETED');
    const totalSpentCAD = processedRfqs.reduce((sum: number, item: HistoryItem) => sum + item.totalCAD, 0);
    const averageOrderValueCAD = historyItems.length > 0 
      ? historyItems.reduce((sum: number, item: HistoryItem) => sum + item.totalCAD, 0) / historyItems.length 
      : 0;
    const acceptanceRate = historyItems.length > 0
      ? historyItems.filter(item => ['APPROVED', 'COMPLETED'].includes(item.status)).length / historyItems.length
      : 0;

    const response = {
      customerId: id,
      customerName: customer.name,
      history: historyItems,
      totalRfqs: historyItems.length,
      metrics: {
        totalSpentCAD,
        averageOrderValueCAD,
        acceptanceRate
      }
    };
    
    return NextResponse.json(createSuccessResponse(response));
  } catch (error) {
    return handleApiError(error);
  }
}