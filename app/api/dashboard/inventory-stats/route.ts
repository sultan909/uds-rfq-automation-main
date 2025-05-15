import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { inventoryItems, rfqs, rfqItems } from '../../../../db/schema';
import { count, eq, and, sql, gt, desc } from 'drizzle-orm';

/**
 * GET /api/dashboard/inventory-stats
 * Get inventory statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Calculate inventory status metrics
    const inventoryStatus = await db
      .select({
        totalItems: count(),
        inStock: sql<number>`COUNT(CASE WHEN stock > low_stock_threshold THEN 1 END)`,
        lowStock: sql<number>`COUNT(CASE WHEN stock <= low_stock_threshold AND stock > 0 THEN 1 END)`,
        outOfStock: sql<number>`COUNT(CASE WHEN stock = 0 THEN 1 END)`
      })
      .from(inventoryItems)
      .then(result => result[0] || { totalItems: 0, inStock: 0, lowStock: 0, outOfStock: 0 });
    
    // Calculate total inventory value
    const totalInventoryValue = await db
      .select({
        value: sql<number>`COALESCE(SUM(stock * cost_cad), 0)`
      })
      .from(inventoryItems)
      .then(result => result[0]?.value || 0);
    
    // Calculate top requested items
    const topRequestedItems = await calculateTopRequestedItems();
    
    // Calculate missed opportunities due to out of stock
    const missedOpportunities = await calculateMissedOpportunities();
    
    // Return statistics
    return NextResponse.json(createSuccessResponse({
      inventoryStatus,
      totalInventoryValueCAD: totalInventoryValue,
      topRequestedItems,
      missedOpportunities,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    return handleApiError(error);
  }
}

// Helper function to calculate top requested items
async function calculateTopRequestedItems() {
  // Get counts of each item in RFQs
  const topItems = await db.execute(sql`
    SELECT 
      i.id,
      i.sku,
      i.description as description,
      COUNT(ri.id) as rfq_count,
      COALESCE(SUM(ri.quantity), 0) as total_quantity,
      i.stock,
      i.cost_cad
    FROM 
      inventory_items i
    JOIN 
      rfq_items ri ON i.id = ri.internal_product_id
    GROUP BY 
      i.id, i.sku, i.description, i.stock, i.cost_cad
    ORDER BY 
      rfq_count DESC
    LIMIT 10
  `);
  
  return topItems.map(item => {
    const itemRecord = item as Record<string, unknown>;
    return {
      sku: String(itemRecord.sku || ''),
      description: String(itemRecord.description || ''),
      rfqCount: Number(itemRecord.rfq_count || 0),
      totalQuantity: Number(itemRecord.total_quantity || 0),
      stock: Number(itemRecord.stock || 0),
      costCAD: Number(itemRecord.cost_cad || 0)
    };
  });
}

// Helper function to calculate missed opportunities
async function calculateMissedOpportunities() {
  // Find rejected RFQs with items that are out of stock
  const missedOpportunities = await db.execute(sql`
    SELECT 
      i.sku,
      i.description as description,
      r.id as rfq_id,
      r.rfq_number,
      r.created_at as date,
      ri.quantity,
      ri.quantity * COALESCE(ri.final_price, ri.suggested_price, i.cost_cad * 1.3) as potential_value_cad
    FROM 
      rfqs r
    JOIN 
      rfq_items ri ON r.id = ri.rfq_id
    JOIN 
      inventory_items i ON ri.internal_product_id = i.id
    WHERE 
      r.status = 'REJECTED' AND i.stock = 0
  `);
  
  return missedOpportunities.map(item => {
    const itemRecord = item as Record<string, unknown>;
    return {
      sku: String(itemRecord.sku || ''),
      description: String(itemRecord.description || ''),
      rfqId: String(itemRecord.rfq_id || ''),
      rfqNumber: String(itemRecord.rfq_number || ''),
      date: new Date(String(itemRecord.date || new Date())),
      quantity: Number(itemRecord.quantity || 0),
      potentialValueCAD: Number(itemRecord.potential_value_cad || 0)
    };
  });
}