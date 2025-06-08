import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rfqItems, inventoryItems, poItems, purchaseOrders, salesHistory, customers } from '@/db/schema';
import { eq, and, sql, gte, desc, notIn } from 'drizzle-orm';

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

    // Get URL parameters for pagination and lazy loading
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const offset = (page - 1) * pageSize;

    // Get main customers for filtering
    const mainCustomers = await db
      .select({
        id: customers.id,
        name: customers.name,
      })
      .from(customers)
      .where(eq(customers.main_customer, true));

    const mainCustomerIds = mainCustomers.map(c => c.id);
    console.log('Main customers found:', mainCustomers);
    console.log('Main customer IDs:', mainCustomerIds);

    // Get RFQ items with all related data
    const rfqItemsQuery = db
      .select({
        // RFQ Item data
        itemId: rfqItems.id,
        customerSku: rfqItems.customerSku,
        quantityRequested: rfqItems.quantity,
        requestedPrice: rfqItems.unitPrice,
        
        // Inventory data
        inventoryId: inventoryItems.id,
        sku: inventoryItems.sku,
        description: inventoryItems.description,
        cost: inventoryItems.cost,
        quantityOnHand: inventoryItems.quantityOnHand,
        quantityReserved: inventoryItems.quantityReserved,
      })
      .from(rfqItems)
      .leftJoin(inventoryItems, eq(rfqItems.internalProductId, inventoryItems.id))
      .where(eq(rfqItems.rfqId, rfqId))
      .limit(pageSize)
      .offset(offset);

    const items = await rfqItemsQuery;
    console.log('RFQ items found:', items.length);

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(rfqItems)
      .where(eq(rfqItems.rfqId, rfqId));
    
    const totalItems = totalCountResult[0]?.count || 0;
    console.log('Total items count:', totalItems);

    // For each item, get additional data
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const inventoryId = item.inventoryId;
        
        // Initialize default values
        let quantityOnPO = 0;
        let randmarData = { price: 0, qty12m: 0 };
        let usgData = { price: 0, qty12m: 0 };
        let dcsData = { price: 0, qty12m: 0 };
        let outsideData = { qty12m: 0, qty3m: 0 };

        if (inventoryId) {
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

          // Get dates for filtering
          const now = new Date();
          const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
          const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

          // Get Randmar data (assume Randmar is first main customer)
          if (mainCustomerIds[0]) {
            const [randmarSales, randmarLastPrice] = await Promise.all([
              db
                .select({
                  totalQty: sql<number>`COALESCE(SUM(${salesHistory.quantity}), 0)`,
                })
                .from(salesHistory)
                .where(
                  and(
                    eq(salesHistory.productId, inventoryId),
                    eq(salesHistory.customerId, mainCustomerIds[0]),
                    gte(salesHistory.saleDate, twelveMonthsAgo.toISOString().split('T')[0])
                  )
                ),
              db
                .select({
                  lastPrice: salesHistory.unitPrice,
                })
                .from(salesHistory)
                .where(
                  and(
                    eq(salesHistory.productId, inventoryId),
                    eq(salesHistory.customerId, mainCustomerIds[0])
                  )
                )
                .orderBy(desc(salesHistory.saleDate))
                .limit(1)
            ]);

            randmarData = {
              price: randmarLastPrice[0]?.lastPrice || 0,
              qty12m: randmarSales[0]?.totalQty || 0,
            };
          }

          // Get USG data (assume USG is second main customer)
          if (mainCustomerIds[1]) {
            const [usg12m, usgLastPrice] = await Promise.all([
              db
                .select({
                  totalQty: sql<number>`COALESCE(SUM(${salesHistory.quantity}), 0)`,
                })
                .from(salesHistory)
                .where(
                  and(
                    eq(salesHistory.productId, inventoryId),
                    eq(salesHistory.customerId, mainCustomerIds[1]),
                    gte(salesHistory.saleDate, twelveMonthsAgo.toISOString().split('T')[0])
                  )
                ),
              db
                .select({
                  lastPrice: salesHistory.unitPrice,
                })
                .from(salesHistory)
                .where(
                  and(
                    eq(salesHistory.productId, inventoryId),
                    eq(salesHistory.customerId, mainCustomerIds[1])
                  )
                )
                .orderBy(desc(salesHistory.saleDate))
                .limit(1)
            ]);

            usgData = {
              price: usgLastPrice[0]?.lastPrice || 0,
              qty12m: usg12m[0]?.totalQty || 0,
            };
          }

          // Get DCS data (assume DCS is third main customer)
          if (mainCustomerIds[2]) {
            const [dcs12m, dcsLastPrice] = await Promise.all([
              db
                .select({
                  totalQty: sql<number>`COALESCE(SUM(${salesHistory.quantity}), 0)`,
                })
                .from(salesHistory)
                .where(
                  and(
                    eq(salesHistory.productId, inventoryId),
                    eq(salesHistory.customerId, mainCustomerIds[2]),
                    gte(salesHistory.saleDate, twelveMonthsAgo.toISOString().split('T')[0])
                  )
                ),
              db
                .select({
                  lastPrice: salesHistory.unitPrice,
                })
                .from(salesHistory)
                .where(
                  and(
                    eq(salesHistory.productId, inventoryId),
                    eq(salesHistory.customerId, mainCustomerIds[2])
                  )
                )
                .orderBy(desc(salesHistory.saleDate))
                .limit(1)
            ]);

            dcsData = {
              price: dcsLastPrice[0]?.lastPrice || 0,
              qty12m: dcs12m[0]?.totalQty || 0,
            };
          }

          // Get outside sales data (customers not in main customers list)
          let outside12m = [{ totalQty: 0 }];
          let outside3m = [{ totalQty: 0 }];
          
          try {
            if (mainCustomerIds.length > 0) {
              [outside12m, outside3m] = await Promise.all([
                db
                  .select({
                    totalQty: sql<number>`COALESCE(SUM(${salesHistory.quantity}), 0)`,
                  })
                  .from(salesHistory)
                  .where(
                    and(
                      eq(salesHistory.productId, inventoryId),
                      notIn(salesHistory.customerId, mainCustomerIds),
                      gte(salesHistory.saleDate, twelveMonthsAgo.toISOString().split('T')[0])
                    )
                  ),
                db
                  .select({
                    totalQty: sql<number>`COALESCE(SUM(${salesHistory.quantity}), 0)`,
                  })
                  .from(salesHistory)
                  .where(
                    and(
                      eq(salesHistory.productId, inventoryId),
                      notIn(salesHistory.customerId, mainCustomerIds),
                      gte(salesHistory.saleDate, threeMonthsAgo.toISOString().split('T')[0])
                    )
                  ),
              ]);
            } else {
              // If no main customers, all sales are "outside"
              [outside12m, outside3m] = await Promise.all([
                db
                  .select({
                    totalQty: sql<number>`COALESCE(SUM(${salesHistory.quantity}), 0)`,
                  })
                  .from(salesHistory)
                  .where(
                    and(
                      eq(salesHistory.productId, inventoryId),
                      gte(salesHistory.saleDate, twelveMonthsAgo.toISOString().split('T')[0])
                    )
                  ),
                db
                  .select({
                    totalQty: sql<number>`COALESCE(SUM(${salesHistory.quantity}), 0)`,
                  })
                  .from(salesHistory)
                  .where(
                    and(
                      eq(salesHistory.productId, inventoryId),
                      gte(salesHistory.saleDate, threeMonthsAgo.toISOString().split('T')[0])
                    )
                  ),
              ]);
            }
          } catch (error) {
            console.warn('Error fetching outside sales data:', error);
            outside12m = [{ totalQty: 0 }];
            outside3m = [{ totalQty: 0 }];
          }

          outsideData = {
            qty12m: outside12m[0]?.totalQty || 0,
            qty3m: outside3m[0]?.totalQty || 0,
          };
        }

        return {
          id: item.itemId,
          sku: item.customerSku || item.sku || 'N/A',
          quantityRequested: item.quantityRequested || 0,
          requestedPrice: item.requestedPrice || 0,
          cost: item.cost || 0,
          qtyOnHand: item.quantityOnHand || 0,
          qtyOnPO: quantityOnPO,
          pricePaidByRandmar: randmarData.price,
          qtyPurchasedByRandmar12m: randmarData.qty12m,
          pricePaidByUSG: usgData.price,
          qtyPurchasedByUSG12m: usgData.qty12m,
          pricePaidByDCS: dcsData.price,
          qtyPurchasedByDCS12m: dcsData.qty12m,
          qtySoldOutside12m: outsideData.qty12m,
          qtySoldOutside3m: outsideData.qty3m,
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
    console.error('Error fetching ALL tab data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch ALL tab data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}