import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { skuMappings, skuVariations, customers } from '../../../../db/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * POST /api/sku-mapping/detect
 * Detect and suggest standard SKUs for non-standard SKUs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    if (!body.skus || !Array.isArray(body.skus) || body.skus.length === 0) {
      throw new ApiError('An array of SKUs is required');
    }

    // Get mappings where the variation SKUs match any of the provided SKUs
    const variations = await db
      .select({
        mappingId: skuVariations.mappingId,
        customerId: skuVariations.customerId,
        customerName: customers.name,
        variationSku: skuVariations.variationSku,
        source: skuVariations.source,
      })
      .from(skuVariations)
      .leftJoin(customers, eq(skuVariations.customerId, customers.id))
      .where(inArray(skuVariations.variationSku, body.skus));

    // Get the standard SKUs for these mapping IDs
    const mappingIds = [...new Set(variations.map(v => v.mappingId))];
    const standards = await db
      .select()
      .from(skuMappings)
      .where(inArray(skuMappings.id, mappingIds));

    // Create the detected mappings result
    const detectedMappings = await Promise.all(
      body.skus.map(async (sku: string) => {
        // Find matching variation
        const matchedVariation = variations.find(v => v.variationSku === sku);
        
        if (!matchedVariation) {
          return {
            sku,
            detected: false,
            message: 'No matching SKU found'
          };
        }
        
        // Find the standard mapping for this variation
        const standardMapping = standards.find(s => s.id === matchedVariation.mappingId);
        
        if (!standardMapping) {
          return {
            sku,
            detected: false,
            message: 'Mapping information not found'
          };
        }
        
        return {
          sku,
          detected: true,
          standardSku: standardMapping.standardSku,
          standardDescription: standardMapping.standardDescription,
          source: matchedVariation.source,
          customerId: matchedVariation.customerId,
          customerName: matchedVariation.customerName
        };
      })
    );
    
    // Return response
    return NextResponse.json(createSuccessResponse(detectedMappings));
  } catch (error) {
    return handleApiError(error);
  }
}