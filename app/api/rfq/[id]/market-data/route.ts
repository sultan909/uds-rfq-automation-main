import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { rfqItems, inventoryItems, marketPricing, salesHistory } from '@/db/schema';
import { eq, and, sql, desc, gte } from 'drizzle-orm';

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

    // Get RFQ items with market data
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
        brand: inventoryItems.brand,
        mpn: inventoryItems.mpn,
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

    // For each item, get market-related data
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const inventoryId = item.inventoryId;
        
        // Initialize default values
        let marketPrice = 0;
        let marketPriceCurrency = 'CAD';
        let competitorPrices: any[] = [];
        let priceVariance = 0;
        let marketSource = 'unknown';
        let lastUpdated = null;
        let priceTrend = 'stable';
        let marketPosition = 'competitive';
        let dataFreshness = 'unknown';

        if (inventoryId) {
          try {
            // Get market pricing data from multiple sources
            const marketPricingData = await db
              .select({
                price: marketPricing.price,
                currency: marketPricing.currency,
                source: marketPricing.source,
                lastUpdated: marketPricing.lastUpdated,
              })
              .from(marketPricing)
              .where(eq(marketPricing.productId, inventoryId))
              .orderBy(desc(marketPricing.lastUpdated));

            if (marketPricingData.length > 0) {
              // Use most recent market price
              const latestPrice = marketPricingData[0];
              marketPrice = latestPrice.price;
              marketPriceCurrency = latestPrice.currency;
              marketSource = latestPrice.source;
              lastUpdated = latestPrice.lastUpdated;

              // Calculate data freshness
              if (lastUpdated) {
                const updatedDate = new Date(lastUpdated);
                const daysSinceUpdate = Math.floor((Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysSinceUpdate <= 1) {
                  dataFreshness = 'fresh';
                } else if (daysSinceUpdate <= 7) {
                  dataFreshness = 'recent';
                } else if (daysSinceUpdate <= 30) {
                  dataFreshness = 'outdated';
                } else {
                  dataFreshness = 'stale';
                }
              }

              // Get competitor prices for analysis
              competitorPrices = marketPricingData.slice(0, 5).map(price => ({
                source: price.source,
                price: price.price,
                currency: price.currency,
                lastUpdated: price.lastUpdated,
              }));

              // Calculate price variance across sources
              if (competitorPrices.length > 1) {
                const prices = competitorPrices.map(p => p.price);
                const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
                const variance = Math.sqrt(prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length);
                priceVariance = Math.round((variance / avg) * 100 * 100) / 100; // Percentage, rounded to 2 decimals
              }

              // Analyze price trend (simplified - compare with historical data)
              if (marketPricingData.length >= 2) {
                const oldestPrice = marketPricingData[marketPricingData.length - 1];
                const priceChange = ((marketPrice - oldestPrice.price) / oldestPrice.price) * 100;
                
                if (priceChange > 5) {
                  priceTrend = 'increasing';
                } else if (priceChange < -5) {
                  priceTrend = 'decreasing';
                } else {
                  priceTrend = 'stable';
                }
              }

              // Determine market position compared to requested price
              if (item.requestedPrice && item.requestedPrice > 0) {
                const priceDiff = ((item.requestedPrice - marketPrice) / marketPrice) * 100;
                
                if (priceDiff > 10) {
                  marketPosition = 'above_market';
                } else if (priceDiff < -10) {
                  marketPosition = 'below_market';
                } else {
                  marketPosition = 'competitive';
                }
              }
            }

          } catch (error) {
            console.warn(`Error fetching market data for item ${inventoryId}:`, error);
          }
        }

        return {
          id: item.itemId,
          sku: item.sku || item.customerSku || 'N/A',
          description: item.description || 'N/A',
          brand: item.brand || 'Unknown',
          mpn: item.mpn || 'Unknown',
          requestedPrice: item.requestedPrice || 0,
          requestedPriceCurrency: item.currency || 'CAD',
          marketPrice: marketPrice,
          marketPriceCurrency: marketPriceCurrency,
          competitorPrices: competitorPrices,
          priceVariance: priceVariance,
          marketSource: marketSource,
          lastUpdated: lastUpdated,
          priceTrend: priceTrend,
          marketPosition: marketPosition,
          dataFreshness: dataFreshness,
          marketNotes: marketPrice > 0 
            ? `Market data from ${marketSource}, ${dataFreshness} data` 
            : 'No market data available',
          recommendedAction: marketPosition === 'above_market' 
            ? 'Consider price adjustment' 
            : marketPosition === 'below_market' 
            ? 'Good pricing opportunity' 
            : 'Price is competitive',
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
    console.error('Error fetching market data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch market data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}