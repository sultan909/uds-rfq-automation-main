import { NextRequest, NextResponse } from 'next/server';
import { SkuMappingService } from '../../lib/mock-db/service';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';

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
    
    // Detect mappings
    const detectedMappings = SkuMappingService.detectMappings(body.skus);
    
    // Return response
    return NextResponse.json(createSuccessResponse(detectedMappings));
  } catch (error) {
    return handleApiError(error);
  }
}