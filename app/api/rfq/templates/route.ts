import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createPaginatedResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';

// Mock data for RFQ templates
const templates = [
  {
    id: '1',
    name: 'Standard RFQ',
    description: 'Standard template for regular customers',
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2025-04-10T14:30:00Z',
    columns: [
      { id: 'sku', label: 'SKU', show: true, order: 1 },
      { id: 'description', label: 'Description', show: true, order: 2 },
      { id: 'quantity', label: 'Quantity', show: true, order: 3 },
      { id: 'price', label: 'Price', show: true, order: 4 },
      { id: 'total', label: 'Total', show: true, order: 5 },
      { id: 'stock', label: 'In Stock', show: true, order: 6 },
      { id: 'marketPrice', label: 'Market Price', show: false, order: 7 },
      { id: 'lastPurchase', label: 'Last Purchase', show: false, order: 8 }
    ]
  },
  {
    id: '2',
    name: 'Wholesaler RFQ',
    description: 'Template for wholesaler customers with volume pricing',
    createdAt: '2025-02-20T10:15:00Z',
    updatedAt: '2025-04-12T09:45:00Z',
    columns: [
      { id: 'sku', label: 'SKU', show: true, order: 1 },
      { id: 'description', label: 'Description', show: true, order: 2 },
      { id: 'quantity', label: 'Quantity', show: true, order: 3 },
      { id: 'price', label: 'Unit Price', show: true, order: 4 },
      { id: 'bulkPrice', label: 'Bulk Price', show: true, order: 5 },
      { id: 'total', label: 'Total', show: true, order: 6 },
      { id: 'stock', label: 'In Stock', show: true, order: 7 },
      { id: 'availability', label: 'Availability', show: true, order: 8 }
    ]
  }
];

/**
 * GET /api/rfq/templates
 * Get RFQ templates
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
    let filteredTemplates = [...templates];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTemplates = filteredTemplates.filter(template => 
        template.name.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedTemplates = filteredTemplates.slice(startIndex, startIndex + pageSize);
    
    // Return response
    return NextResponse.json(
      createPaginatedResponse(paginatedTemplates, page, pageSize, filteredTemplates.length)
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/rfq/templates/create
 * Create a new RFQ template
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }
    
    // Create a new template
    const newTemplate = {
      id: `${templates.length + 1}`,
      name: body.name,
      description: body.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      columns: body.columns || [
        { id: 'sku', label: 'SKU', show: true, order: 1 },
        { id: 'description', label: 'Description', show: true, order: 2 },
        { id: 'quantity', label: 'Quantity', show: true, order: 3 },
        { id: 'price', label: 'Price', show: true, order: 4 },
        { id: 'total', label: 'Total', show: true, order: 5 }
      ]
    };
    
    // Add the template to the list
    templates.push(newTemplate);
    
    // Return the created template
    return NextResponse.json(
      createSuccessResponse(newTemplate),
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}