import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';

// In a real app, this would interact with the marketplace data service
// For now, we'll just define a mock object to simulate updates
const marketplaceData: Record<string, Array<{ source: string, priceCAD: number }>> = {
  'CF226X': [
    { source: 'Marketplace 1', priceCAD: 125.99 },
    { source: 'Marketplace 2', priceCAD: 129.5 },
    { source: 'Marketplace 3', priceCAD: 122.75 }
  ],
  'CE255X': [
    { source: 'Marketplace 1', priceCAD: 98.5 },
    { source: 'Marketplace 2', priceCAD: 102.25 },
    { source: 'Marketplace 3', priceCAD: 97.99 }
  ]
};

/**
 * POST /api/marketplace/update
 * Update marketplace data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.sku || !body.source || body.priceCAD === undefined) {
      throw new ApiError('SKU, source, and priceCAD are required', 400);
    }
    
    const { sku, source, priceCAD } = body;
    
    // Check if the SKU exists in the marketplace data
    if (!marketplaceData[sku]) {
      // If not, create a new entry
      marketplaceData[sku] = [];
    }
    
    // Check if the source exists for the SKU
    const sourceIndex = marketplaceData[sku].findIndex(item => item.source === source);
    
    if (sourceIndex === -1) {
      // If not, add a new source
      marketplaceData[sku].push({ source, priceCAD });
    } else {
      // If yes, update the price
      marketplaceData[sku][sourceIndex].priceCAD = priceCAD;
    }
    
    // Return success response with the updated data
    return NextResponse.json(
      createSuccessResponse({
        sku,
        source,
        priceCAD,
        updated: new Date().toISOString(),
        currentData: marketplaceData[sku]
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}