import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '../../../lib/api-response';
import { handleApiError } from '../../../lib/error-handler';

// Mock data for RFQ templates - this would normally be imported from a database service
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

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/rfq/templates/:id
 * Get a specific template
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Find the template
    const template = templates.find(t => t.id === id);
    
    if (!template) {
      return NextResponse.json(
        createErrorResponse(`Template with ID ${id} not found`),
        { status: 404 }
      );
    }
    
    return NextResponse.json(createSuccessResponse(template));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/rfq/templates/:id
 * Update a template
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Find the template
    const templateIndex = templates.findIndex(t => t.id === id);
    
    if (templateIndex === -1) {
      return NextResponse.json(
        createErrorResponse(`Template with ID ${id} not found`),
        { status: 404 }
      );
    }
    
    // Update the template
    const updatedTemplate = {
      ...templates[templateIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    templates[templateIndex] = updatedTemplate;
    
    return NextResponse.json(createSuccessResponse(updatedTemplate));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/rfq/templates/:id
 * Delete a template
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Find the template
    const templateIndex = templates.findIndex(t => t.id === id);
    
    if (templateIndex === -1) {
      return NextResponse.json(
        createErrorResponse(`Template with ID ${id} not found`),
        { status: 404 }
      );
    }
    
    // Remove the template
    templates.splice(templateIndex, 1);
    
    return NextResponse.json(
      createSuccessResponse({ message: `Template ${id} deleted successfully` })
    );
  } catch (error) {
    return handleApiError(error);
  }
}