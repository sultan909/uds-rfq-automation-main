import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { rfqs, rfqItems, inventoryItems, skuMappings, salesHistory } from '../../../../db/schema';
import { eq, or, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Export the POST method
export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { customerId, source, notes, items, currency } = body;

    // Generate a unique RFQ number
    const rfqNumber = `RFQ-${nanoid(8).toUpperCase()}`;

    // Create the RFQ
    // @ts-ignore
    const [newRfq] = await db.insert(rfqs).values({
      rfqNumber,
      title: `RFQ for ${rfqNumber}`,
      description: notes || '',
      requestorId: 1, // TODO: Get from session
      customerId,
      source,
      notes,
      status: 'PENDING',
    }).returning();

    // Process items to find inventory matches and history
    const processedItems = await Promise.all(items.map(async (item: any) => {
      let inventoryId = null;
      let inventoryData = null;
      let historyData = null;

      // Try to find inventory item by SKU or SKU mapping
      if (item.sku) {
        // First try direct SKU match
        let inventoryItem = await db.query.inventoryItems.findFirst({
          where: eq(inventoryItems.sku, item.sku)
        });

        // If no direct match, try SKU mapping
        if (!inventoryItem) {
          const skuMapping = await db.query.skuMappings.findFirst({
            where: eq(skuMappings.standardSku, item.sku)
          });
          
          if (skuMapping) {
            inventoryItem = await db.query.inventoryItems.findFirst({
              where: eq(inventoryItems.sku, skuMapping.standardSku)
            });
          }
        }

        if (inventoryItem) {
          inventoryId = inventoryItem.id;
          // Fetch complete inventory data
          const completeInventoryItem = await db.query.inventoryItems.findFirst({
            where: eq(inventoryItems.id, inventoryItem.id)
          });

          if (completeInventoryItem) {
            inventoryData = {
              id: completeInventoryItem.id,
              sku: completeInventoryItem.sku,
              description: completeInventoryItem.description,
              stock: completeInventoryItem.stock,
              costCad: completeInventoryItem.costCad,
              costUsd: completeInventoryItem.costUsd,
              quantityOnHand: completeInventoryItem.quantityOnHand,
              quantityReserved: completeInventoryItem.quantityReserved,
              warehouseLocation: completeInventoryItem.warehouseLocation,
              lowStockThreshold: completeInventoryItem.lowStockThreshold,
              lastSaleDate: completeInventoryItem.lastSaleDate,
              brand: completeInventoryItem.brand,
              mpn: completeInventoryItem.mpn
            };

            // Fetch sales history for this inventory item
            const salesHistoryItems = await db
              .select()
              .from(salesHistory)
              .where(eq(salesHistory.productId, completeInventoryItem.id))
              .orderBy(desc(salesHistory.saleDate))
              .limit(5);

            historyData = salesHistoryItems.map(history => ({
              id: history.id,
              date: history.saleDate,
              quantity: history.quantity,
              price: history.unitPrice,
              customerId: history.customerId,
              invoiceNumber: history.invoiceNumber
            }));
          }
        }
      }

      return {
        rfqId: newRfq.id,
        name: item.description || item.sku,
        description: item.description,
        quantity: item.quantity || 1,
        unit: item.unit || 'EA',
        customerSku: item.sku,
        internalProductId: inventoryId,
        suggestedPrice: item.price,
        finalPrice: null,
        currency: currency || 'CAD',
        status: 'PENDING',
        estimatedPrice: item.price,
        inventory: inventoryData,
        history: historyData
      };
    }));

    // Insert RFQ items
    const [insertedItems] = await db.insert(rfqItems)
      .values(processedItems.map(item => ({
        rfqId: item.rfqId,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        customerSku: item.customerSku,
        internalProductId: item.internalProductId,
        suggestedPrice: item.suggestedPrice,
        finalPrice: item.finalPrice,
        currency: item.currency,
        status: item.status,
        estimatedPrice: item.estimatedPrice
      })))
      .returning();

    // Return response with items including inventory and history data
    return NextResponse.json(
      createSuccessResponse({
        id: newRfq.id,
        rfqNumber: newRfq.rfqNumber,
        items: processedItems
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating RFQ:', error);
    return handleApiError(error);
  }
}; 