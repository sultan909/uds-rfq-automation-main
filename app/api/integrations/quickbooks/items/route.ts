import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createPaginatedResponse } from '../../../lib/api-response';
import { handleApiError } from '../../../lib/error-handler';

// Mock QuickBooks items
const quickbooksItems = [
  {
    id: '1',
    name: 'HP 26X High Yield Black Toner',
    sku: 'CF226X',
    type: 'Inventory',
    active: true,
    unitPrice: 115.75,
    purchaseCost: 89.50,
    qtyOnHand: 24,
    incomeAccountRef: {
      value: '1',
      name: 'Sales'
    },
    expenseAccountRef: {
      value: '2',
      name: 'Cost of Goods Sold'
    },
    assetAccountRef: {
      value: '3',
      name: 'Inventory Asset'
    },
    lastModified: '2025-04-15T14:30:00Z'
  },
  {
    id: '2',
    name: 'HP 55X High Yield Black Toner',
    sku: 'CE255X',
    type: 'Inventory',
    active: true,
    unitPrice: 105.25,
    purchaseCost: 78.25,
    qtyOnHand: 12,
    incomeAccountRef: {
      value: '1',
      name: 'Sales'
    },
    expenseAccountRef: {
      value: '2',
      name: 'Cost of Goods Sold'
    },
    assetAccountRef: {
      value: '3',
      name: 'Inventory Asset'
    },
    lastModified: '2025-04-18T10:20:00Z'
  },
  {
    id: '3',
    name: 'HP 05X High Yield Black Toner',
    sku: 'CE505X',
    type: 'Inventory',
    active: true,
    unitPrice: 89.99,
    purchaseCost: 65.75,
    qtyOnHand: 3,
    incomeAccountRef: {
      value: '1',
      name: 'Sales'
    },
    expenseAccountRef: {
      value: '2',
      name: 'Cost of Goods Sold'
    },
    assetAccountRef: {
      value: '3',
      name: 'Inventory Asset'
    },
    lastModified: '2025-04-20T15:45:00Z'
  }
];

/**
 * GET /api/integrations/quickbooks/items
 * Get items from QuickBooks
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract filter parameters
    const search = searchParams.get('search');
    const active = searchParams.get('active');
    
    // Extract pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    
    // Apply filtering
    let filteredItems = [...quickbooksItems];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.sku.toLowerCase().includes(searchLower)
      );
    }
    
    if (active === 'true') {
      filteredItems = filteredItems.filter(item => item.active);
    } else if (active === 'false') {
      filteredItems = filteredItems.filter(item => !item.active);
    }
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);
    
    // Return response
    return NextResponse.json(
      createPaginatedResponse(paginatedItems, page, pageSize, filteredItems.length)
    );
  } catch (error) {
    return handleApiError(error);
  }
}