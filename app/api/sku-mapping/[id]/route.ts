import { NextRequest, NextResponse } from 'next/server';
import { SkuMappingService } from '../../lib/mock-db/service';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/sku-mapping/:id
 * Get a specific SKU mapping by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Get mapping
    const mapping = SkuMappingService.getById(id);
    
    // Check if mapping exists
    if (!mapping) {
      throw new ApiError(`SKU mapping with ID ${id} not found`, 404);
    }
    
    // Return response
    return NextResponse.json(createSuccessResponse(mapping));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/sku-mapping/:id
 * Update a specific SKU mapping
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Check if mapping exists
    const existingMapping = SkuMappingService.getById(id);
    if (!existingMapping) {
      throw new ApiError(`SKU mapping with ID ${id} not found`, 404);
    }
    
    // Update mapping
    const updatedMapping = SkuMappingService.update(id, body);
    
    // Return response
    return NextResponse.json(createSuccessResponse(updatedMapping));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/sku-mapping/:id
 * Delete a SKU mapping
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Check if mapping exists
    const existingMapping = SkuMappingService.getById(id);
    if (!existingMapping) {
      throw new ApiError(`SKU mapping with ID ${id} not found`, 404);
    }
    
    // Delete mapping
    const success = SkuMappingService.delete(id);
    
    if (!success) {
      throw new ApiError(`Failed to delete SKU mapping with ID ${id}`, 500);
    }
    
    // Return success response
    return NextResponse.json(
      createSuccessResponse({ message: `SKU mapping ${id} deleted successfully` })
    );
  } catch (error) {
    return handleApiError(error);
  }
}