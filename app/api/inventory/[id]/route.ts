import { NextRequest, NextResponse } from 'next/server';
import { InventoryService, MarketplaceService } from '../../lib/mock-db/service';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/inventory/:id
 * Get a specific inventory item by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Get inventory item
    const item = InventoryService.getById(id);
    
    // Check if item exists
    if (!item) {
      throw new ApiError(`Inventory item with ID ${id} not found`, 404);
    }
    
    // Get marketplace data for SKU
    const marketplaceData = MarketplaceService.getPricing(item.sku);
    
    // Get average marketplace price
    const avgMarketPrice = MarketplaceService.getAveragePrice(item.sku);
    
    // Combine item and marketplace data
    const responseData = {
      ...item,
      marketplaceData,
      avgMarketPrice
    };
    
    // Return response
    return NextResponse.json(createSuccessResponse(responseData));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/inventory/:id
 * Update a specific inventory item
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Check if item exists
    const existingItem = InventoryService.getById(id);
    if (!existingItem) {
      throw new ApiError(`Inventory item with ID ${id} not found`, 404);
    }
    
    // Update stock flags if stock is being updated
    if (body.stock !== undefined) {
      body.lowStock = body.stock > 0 && body.stock <= 5;
      body.outOfStock = body.stock === 0;
    }
    
    // Update item
    const updatedItem = InventoryService.update(id, body);
    
    // Return response
    return NextResponse.json(createSuccessResponse(updatedItem));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/inventory/:id
 * Delete an inventory item (not implemented in the mock service)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // In a real implementation, we would delete the inventory item
    // For the mock implementation, we'll just return a success message
    
    const { id } = params;
    
    // Check if item exists
    const existingItem = InventoryService.getById(id);
    if (!existingItem) {
      throw new ApiError(`Inventory item with ID ${id} not found`, 404);
    }
    
    // Return success response
    return NextResponse.json(
      createSuccessResponse({ message: `Inventory item ${id} deleted successfully` })
    );
  } catch (error) {
    return handleApiError(error);
  }
}