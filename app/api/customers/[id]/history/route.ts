import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../../lib/api-response';
import { handleApiError, ApiError } from '../../../lib/error-handler';
import { db } from '@/db';
import { customers, rfqs, rfqItems, salesHistory, auditLog, inventoryItems } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/customers/:id/history
 * Get comprehensive history for a specific customer including:
 * - RFQ history
 * - Sales history
 * - Audit log entries
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'all'; // all, 3months, 6months, 12months
    
    // Check if customer exists
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, parseInt(id)))
      .then(results => results[0]);
    
    if (!customer) {
      throw new ApiError(`Customer with ID ${id} not found`, 404);
    }
    
    // Calculate cutoff date based on period
    let cutoffDate: string | undefined;
    if (period !== 'all') {
      const now = new Date();
      let monthsBack = 0;
      
      if (period === '3months') monthsBack = 3;
      else if (period === '6months') monthsBack = 6;
      else if (period === '12months') monthsBack = 12;
      
      const date = new Date(now);
      date.setMonth(now.getMonth() - monthsBack);
      cutoffDate = date.toISOString();
    }

    // Build date filter condition
    const dateFilter = cutoffDate ? sql`${cutoffDate}::timestamp` : undefined;

    // Get RFQ history
    const rfqHistory = await db
      .select({
        id: rfqs.id,
        rfqNumber: rfqs.rfqNumber,
        status: rfqs.status,
        totalBudget: rfqs.totalBudget,
        createdAt: rfqs.createdAt,
        itemCount: sql<number>`COUNT(${rfqItems.id})`.as('item_count')
      })
      .from(rfqs)
      .leftJoin(rfqItems, eq(rfqs.id, rfqItems.rfqId))
      .where(
        and(
          eq(rfqs.customerId, parseInt(id)),
          dateFilter ? sql`${rfqs.createdAt} >= ${dateFilter}` : undefined
        )
      )
      .groupBy(rfqs.id)
      .orderBy(desc(rfqs.createdAt));

    // Get sales history
    const sales = await db
      .select({
        id: salesHistory.id,
        type: sql<string>`'sale'`.as('type'),
        date: salesHistory.saleDate,
        documentNumber: salesHistory.invoiceNumber,
        sku: inventoryItems.sku,
        description: inventoryItems.description,
        quantity: salesHistory.quantity,
        unitPrice: salesHistory.unitPrice,
        totalAmount: salesHistory.extendedPrice
      })
      .from(salesHistory)
      .leftJoin(inventoryItems, eq(salesHistory.productId, inventoryItems.id))
      .where(
        and(
          eq(salesHistory.customerId, parseInt(id)),
          dateFilter ? sql`${salesHistory.saleDate} >= ${dateFilter}::date` : undefined
        )
      )
      .orderBy(desc(salesHistory.saleDate));

    // Get audit log entries
    const auditEntries = await db
      .select()
      .from(auditLog)
      .where(
        and(
          eq(auditLog.entityType, 'customers'),
          eq(auditLog.entityId, parseInt(id)),
          dateFilter ? sql`${auditLog.timestamp} >= ${dateFilter}` : undefined
        )
      )
      .orderBy(desc(auditLog.timestamp));

    // Calculate metrics
    const metrics = {
      totalSpentCAD: sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0),
      averageOrderValueCAD: sales.length ? 
        sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0) / sales.length : 0,
      acceptanceRate: rfqHistory.length ? 
        rfqHistory.filter(rfq => ['APPROVED', 'COMPLETED'].includes(rfq.status)).length / rfqHistory.length : 0
    };

    // Combine all history items
    const history = [
      ...sales,
      ...rfqHistory.map(rfq => ({
        id: rfq.id,
        type: 'rfq',
        date: rfq.createdAt,
        documentNumber: rfq.rfqNumber,
        description: `RFQ with ${rfq.itemCount} items`,
        totalAmount: rfq.totalBudget
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Create response
    const response = {
      customerId: parseInt(id),
      customerName: customer.name,
      history,
      rfqs: rfqHistory,
      auditLog: auditEntries,
      totalRfqs: rfqHistory.length,
      metrics
    };
    
    return NextResponse.json(createSuccessResponse(response));
  } catch (error) {
    return handleApiError(error);
  }
}