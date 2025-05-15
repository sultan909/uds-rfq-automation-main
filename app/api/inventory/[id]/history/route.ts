// app/api/inventory/[id]/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../../lib/api-response';
import { handleApiError, ApiError } from '../../../lib/error-handler';
import { db } from '../../../../../db';
import { inventoryItems, auditLog, poItems, salesHistory, purchaseOrders } from '../../../../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

interface RouteParams {
  params: {
    id: string;
  };
}

// Define type for audit log details
interface StockChangeDetails {
  stock?: number;
  previousStock?: number;
  [key: string]: any;
}

/**
 * GET /api/inventory/:id/history
 * Get the history for a specific inventory item
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    // Check if item exists
    const item = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, parseInt(id)))
      .then(results => results[0]);
    
    if (!item) {
      throw new ApiError(`Inventory item with ID ${id} not found`, 404);
    }
    
    // Get audit log entries for this item
    const auditEntries = await db
      .select()
      .from(auditLog)
      .where(
        and(
          eq(auditLog.entityType, 'inventory_items'),
          eq(auditLog.entityId, parseInt(id))
        )
      )
      .orderBy(desc(auditLog.timestamp))
      .limit(limit);
    
    // Get purchase history (from purchase orders)
    const purchases = await db
      .select({
        id: poItems.id,
        type: sql`'purchase'`.as('type'),
        date: purchaseOrders.orderDate,
        quantity: poItems.quantity,
        documentNumber: purchaseOrders.poNumber,
        price: poItems.unitCost,
        totalAmount: poItems.extendedCost,
        createdAt: poItems.createdAt
      })
      .from(poItems)
      .innerJoin(purchaseOrders, eq(poItems.poId, purchaseOrders.id))
      .where(eq(poItems.productId, parseInt(id)))
      .orderBy(desc(poItems.createdAt))
      .limit(limit);
    
    // Get sales history
    const sales = await db
      .select({
        id: salesHistory.id,
        type: sql`'sale'`.as('type'),
        date: salesHistory.saleDate,
        quantity: salesHistory.quantity,
        documentNumber: salesHistory.invoiceNumber,
        price: salesHistory.unitPrice,
        totalAmount: salesHistory.extendedPrice,
        createdAt: salesHistory.createdAt
      })
      .from(salesHistory)
      .where(eq(salesHistory.productId, parseInt(id)))
      .orderBy(desc(salesHistory.createdAt))
      .limit(limit);
    
    // Combine and sort transactions
    const allTransactions = [...purchases, ...sales]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    
    // Calculate stock history (could be derived from transactions)
    const stockHistory = auditEntries
      .filter(entry => {
        const details = entry.details as StockChangeDetails | null;
        return details && typeof details === 'object' && 'stock' in details;
      })
      .map(entry => {
        const details = entry.details as StockChangeDetails;
        return {
          timestamp: entry.timestamp,
          previousStock: details.previousStock,
          newStock: details.stock,
          userId: entry.userId,
          action: entry.action
        };
      });
    
    // Create response
    const historyData = {
      inventoryItem: item,
      auditLog: auditEntries,
      transactions: allTransactions,
      stockHistory: stockHistory
    };
    
    return NextResponse.json(createSuccessResponse(historyData));
  } catch (error) {
    return handleApiError(error);
  }
}