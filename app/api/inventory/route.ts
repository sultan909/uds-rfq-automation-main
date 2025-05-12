import { NextRequest, NextResponse } from 'next/server';
import { InventoryService } from '../lib/mock-db/service';
import { createPaginatedResponse, createSuccessResponse } from '../lib/api-response';
import { handleApiError, ApiError } from '../lib/error-handler';

/**
 * GET /api/inventory
 * Get all inventory items with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract filter parameters
    const lowStock = searchParams.get('lowStock') === 'true';
    const outOfStock = searchParams.get('outOfStock') === 'true';
    const search = searchParams.get('search');
    
    // Extract pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    
    // Apply filtering
    const filter: any = {};
    if (lowStock) filter.lowStock = lowStock;
    if (outOfStock) filter.outOfStock = outOfStock;
    if (search) filter.search = search;
    
    // Get inventory items
    const allItems = InventoryService.getAll(filter);
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = allItems.slice(startIndex, startIndex + pageSize);
    
    // Return response
    return NextResponse.json(
      createPaginatedResponse(paginatedItems, page, pageSize, allItems.length)
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/inventory
 * Create a new inventory item
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.sku) {
      throw new ApiError('SKU is required');
    }
    
    if (!body.description) {
      throw new ApiError('Description is required');
    }
    
    if (body.stock === undefined || body.stock === null) {
      body.stock = 0;
    }
    
    if (body.costCAD === undefined || body.costCAD === null) {
      throw new ApiError('Cost in CAD is required');
    }
    
    // Check if SKU already exists
    const existingItem = InventoryService.getBySku(body.sku);
    if (existingItem) {
      throw new ApiError(`Inventory item with SKU ${body.sku} already exists`);
    }
    
    // Set flags based on stock
    body.lowStock = body.stock > 0 && body.stock <= 5;
    body.outOfStock = body.stock === 0;
    
    // Set last sale date if not provided
    if (!body.lastSale) {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const year = today.getFullYear();
      body.lastSale = `${month}/${day}/${year}`;
    }
    
    // Create inventory item
    const newItem = InventoryService.create(body);
    
    // Return response
    return NextResponse.json(
      createSuccessResponse(newItem),
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}