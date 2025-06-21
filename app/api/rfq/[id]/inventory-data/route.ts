import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rfqItems, inventoryItems, poItems, purchaseOrders, salesHistory } from '@/db/schema';
import { eq, and, sql, gte, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rfqId = parseInt(id);

    if (isNaN(rfqId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid RFQ ID' },
        { status: 400 }
      );
    }

    // Get URL parameters for pagination
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const offset = (page - 1) * pageSize;

    // Get RFQ items with inventory data
    const rfqItemsQuery = db
      .select({
        // RFQ Item data
        itemId: rfqItems.id,
        customerSku: rfqItems.customerSku,
        quantityRequested: rfqItems.quantity,
        
        // Inventory data
        inventoryId: inventoryItems.id,
        sku: inventoryItems.sku,
        description: inventoryItems.description,
        quantityOnHand: inventoryItems.quantityOnHand,
        quantityReserved: inventoryItems.quantityReserved,
        warehouseLocation: inventoryItems.warehouseLocation,
        lowStockThreshold: inventoryItems.lowStockThreshold,
        lastSaleDate: inventoryItems.lastSaleDate,
      })
      .from(rfqItems)
      .leftJoin(inventoryItems, eq(rfqItems.internalProductId, inventoryItems.id))
      .where(eq(rfqItems.rfqId, rfqId))
      .limit(pageSize)
      .offset(offset);

    const items = await rfqItemsQuery;

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(rfqItems)
      .where(eq(rfqItems.rfqId, rfqId));
    
    const totalItems = totalCountResult[0]?.count || 0;

    // For each item, get inventory-related data
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const inventoryId = item.inventoryId;
        
        // Initialize default values
        let quantityOnPO = 0;
        let availableQuantity = 0;
        let stockStatus = 'unknown';
        let reorderPoint = 0;
        let lastMovement = null;
        let turnoverRate = 0;
        let daysSinceLastSale = null;

        if (inventoryId) {
          try {
            // Get Quantity on PO
            const poData = await db
              .select({
                totalQty: sql<number>`COALESCE(SUM(${poItems.quantity}), 0)`,
              })
              .from(poItems)
              .innerJoin(purchaseOrders, eq(poItems.poId, purchaseOrders.id))
              .where(
                and(
                  eq(poItems.productId, inventoryId),
                  eq(purchaseOrders.status, 'PENDING')
                )
              );
            
            quantityOnPO = poData[0]?.totalQty || 0;

            // Calculate available quantity
            const onHand = item.quantityOnHand || 0;
            const reserved = item.quantityReserved || 0;
            availableQuantity = Math.max(0, onHand - reserved);

            // Determine stock status
            const lowStockThreshold = item.lowStockThreshold || 5;
            if (onHand <= 0) {
              stockStatus = 'out_of_stock';
            } else if (onHand <= lowStockThreshold) {
              stockStatus = 'low_stock';
            } else if (onHand <= lowStockThreshold * 2) {
              stockStatus = 'medium_stock';
            } else {
              stockStatus = 'in_stock';
            }

            // Calculate reorder point (simple algorithm)
            reorderPoint = Math.max(lowStockThreshold, Math.floor(item.quantityRequested * 1.5));

            // Get sales data for turnover calculation
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const salesData = await db
              .select({
                totalQuantity: sql<number>`COALESCE(SUM(${salesHistory.quantity}), 0)`,
                lastSaleDate: sql<string>`MAX(${salesHistory.saleDate})`,
              })
              .from(salesHistory)
              .where(
                and(
                  eq(salesHistory.productId, inventoryId),
                  gte(salesHistory.saleDate, thirtyDaysAgo.toISOString().split('T')[0])
                )
              );

            const salesInLast30Days = salesData[0]?.totalQuantity || 0;
            const lastSaleDateStr = salesData[0]?.lastSaleDate;

            // Calculate turnover rate (monthly)
            if (onHand > 0) {
              turnoverRate = salesInLast30Days / onHand;
            }

            // Calculate days since last sale
            if (lastSaleDateStr) {
              const lastSaleDate = new Date(lastSaleDateStr);
              const today = new Date();
              daysSinceLastSale = Math.floor((today.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24));
            } else if (item.lastSaleDate) {
              const lastSaleDate = new Date(item.lastSaleDate);
              const today = new Date();
              daysSinceLastSale = Math.floor((today.getTime() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24));
            }

          } catch (error) {
            // Silently handle error - use default values
          }
        }

        return {
          id: item.itemId,
          sku: item.sku || item.customerSku || 'N/A',
          description: item.description || 'N/A',
          quantityRequested: item.quantityRequested || 0,
          quantityOnHand: item.quantityOnHand || 0,
          quantityReserved: item.quantityReserved || 0,
          quantityOnPO: quantityOnPO,
          availableQuantity: availableQuantity,
          warehouseLocation: item.warehouseLocation || 'Unknown',
          stockStatus: stockStatus,
          lowStockThreshold: item.lowStockThreshold || 5,
          reorderPoint: reorderPoint,
          turnoverRate: Math.round(turnoverRate * 100) / 100, // Round to 2 decimal places
          daysSinceLastSale: daysSinceLastSale,
          lastSaleDate: item.lastSaleDate,
          inventoryNotes: availableQuantity >= item.quantityRequested 
            ? 'Sufficient stock available' 
            : 'Insufficient stock - may need to order',
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedItems,
      meta: {
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages: Math.ceil(totalItems / pageSize),
        },
      },
    });

  } catch (error) {
    console.error('Error fetching inventory data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch inventory data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}