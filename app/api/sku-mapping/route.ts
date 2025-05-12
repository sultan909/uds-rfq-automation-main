import { NextRequest, NextResponse } from 'next/server';
import { SkuMappingService } from '../lib/mock-db/service';
import { createPaginatedResponse, createSuccessResponse } from '../lib/api-response';
import { handleApiError, ApiError } from '../lib/error-handler';

/**
 * GET /api/sku-mapping
 * Get all SKU mappings with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract filter parameters
    const search = searchParams.get('search');
    
    // Extract pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    
    // Apply filtering
    const filter: any = {};
    if (search) filter.search = search;
    
    // Get mappings
    const allMappings = SkuMappingService.getAll(filter);
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedMappings = allMappings.slice(startIndex, startIndex + pageSize);
    
    // Return response
    return NextResponse.json(
      createPaginatedResponse(paginatedMappings, page, pageSize, allMappings.length)
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/sku-mapping
 * Create a new SKU mapping
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.standardSku) {
      throw new ApiError('Standard SKU is required');
    }
    
    if (!body.standardDescription) {
      throw new ApiError('Standard description is required');
    }
    
    if (!body.variations || !Array.isArray(body.variations) || body.variations.length === 0) {
      throw new ApiError('At least one variation is required');
    }
    
    // Validate variations
    for (const variation of body.variations) {
      if (!variation.sku) {
        throw new ApiError('SKU is required for all variations');
      }
      
      if (!variation.source) {
        throw new ApiError('Source is required for all variations');
      }
    }
    
    // Create mapping
    const newMapping = SkuMappingService.create(body);
    
    // Return response
    return NextResponse.json(
      createSuccessResponse(newMapping),
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}