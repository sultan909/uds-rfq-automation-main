import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rfqItems, inventoryItems, marketPricing, salesHistory, customers } from '@/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

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

    // Get RFQ items with pricing data
    const rfqItemsQuery = db
      .select({
        // RFQ Item data
        itemId: rfqItems.id,
        customerSku: rfqItems.customerSku,
        quantityRequested: rfqItems.quantity,
        requestedPrice: rfqItems.unitPrice,
        currency: rfqItems.currency,
        
        // Inventory data
        inventoryId: inventoryItems.id,
        sku: inventoryItems.sku,
        description: inventoryItems.description,
        cost: inventoryItems.cost,
        costCurrency: inventoryItems.costCurrency,
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

    // For each item, get pricing-related data
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const inventoryId = item.inventoryId;
        
        // Initialize default values
        let suggestedPrice = 0;
        let marketPrice = 0;
        let lastSalePrice = 0;
        let margin = 0;
        let priceSource = 'manual';
        let competitorPrices: any[] = [];

        if (inventoryId) {
          try {
            // Get market pricing data
            const marketPricingData = await db
              .select({
                price: marketPricing.price,
                currency: marketPricing.currency,
                source: marketPricing.source,
                lastUpdated: marketPricing.lastUpdated,
              })
              .from(marketPricing)
              .where(eq(marketPricing.productId, inventoryId))
              .orderBy(desc(marketPricing.lastUpdated))
              .limit(5);

            if (marketPricingData.length > 0) {
              marketPrice = marketPricingData[0].price;
              competitorPrices = marketPricingData;
              priceSource = 'market';
            }

            // Get last sale price
            const lastSale = await db
              .select({
                unitPrice: salesHistory.unitPrice,
                currency: salesHistory.currency,
                saleDate: salesHistory.saleDate,
              })
              .from(salesHistory)
              .where(eq(salesHistory.productId, inventoryId))
              .orderBy(desc(salesHistory.saleDate))
              .limit(1);

            if (lastSale.length > 0) {
              lastSalePrice = lastSale[0].unitPrice;
            }

            // Calculate suggested price (basic algorithm)
            const cost = item.cost || 0;
            const requestedPrice = item.requestedPrice || 0;
            
            if (marketPrice > 0) {
              // Use market price as base with 15% markup
              suggestedPrice = marketPrice * 1.15;
            } else if (lastSalePrice > 0) {
              // Use last sale price with 10% markup
              suggestedPrice = lastSalePrice * 1.10;
            } else if (cost > 0) {
              // Use cost with 25% markup
              suggestedPrice = cost * 1.25;
            } else if (requestedPrice > 0) {
              // Fallback to requested price
              suggestedPrice = requestedPrice;
            }

            // Calculate margin
            if (suggestedPrice > 0 && cost > 0) {
              margin = ((suggestedPrice - cost) / suggestedPrice) * 100;
            }

          } catch (error) {
            // Silently handle error - use default values
          }
        }

        return {
          id: item.itemId,
          sku: item.sku || item.customerSku || 'N/A',
          description: item.description || 'N/A',
          requestedPrice: item.requestedPrice || 0,
          requestedPriceCurrency: item.currency || 'CAD',
          suggestedPrice: suggestedPrice,
          suggestedPriceCurrency: item.costCurrency || 'CAD',
          marketPrice: marketPrice,
          marketPriceCurrency: competitorPrices[0]?.currency || 'CAD',
          cost: item.cost || 0,
          costCurrency: item.costCurrency || 'CAD',
          margin: Math.round(margin * 100) / 100, // Round to 2 decimal places
          lastSalePrice: lastSalePrice,
          priceSource: priceSource,
          competitorPrices: competitorPrices,
          pricingNotes: `Based on ${priceSource} data`,
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
    console.error('Error fetching pricing data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch pricing data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}