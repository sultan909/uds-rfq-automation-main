import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceService } from '../../lib/mock-db/service';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';

/**
 * GET /api/marketplace/prices
 * Get marketplace prices for SKUs
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract SKUs from query parameters
    const skus = searchParams.get('skus');
    
    if (!skus) {
      throw new ApiError('SKUs parameter is required', 400);
    }
    
    // Parse SKUs
    const skuArray = skus.split(',').map(sku => sku.trim());
    
    // Get pricing data for the SKUs
    const pricingData = MarketplaceService.getPricingBatch(skuArray);
    
    // Get average prices
    const averagePrices: Record<string, number | undefined> = {};
    for (const sku of skuArray) {
      averagePrices[sku] = MarketplaceService.getAveragePrice(sku);
    }
    
    // Return response
    return NextResponse.json(
      createSuccessResponse({
        prices: pricingData,
        averages: averagePrices,
        timestamp: new Date().toISOString()
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}