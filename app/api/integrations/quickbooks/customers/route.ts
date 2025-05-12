import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createPaginatedResponse } from '../../../lib/api-response';
import { handleApiError } from '../../../lib/error-handler';

// Mock QuickBooks customers
const quickbooksCustomers = [
  {
    id: '1',
    displayName: 'Tech Solutions Inc',
    companyName: 'Tech Solutions Inc',
    active: true,
    primaryEmailAddr: {
      address: 'orders@techsolutions.com'
    },
    primaryPhone: {
      freeFormNumber: '555-123-4567'
    },
    billAddr: {
      line1: '123 Tech St',
      city: 'Techville',
      country: 'USA',
      postalCode: '12345'
    },
    metadata: {
      lastUpdatedTime: '2025-04-22T14:35:00Z'
    }
  },
  {
    id: '2',
    displayName: 'ABC Electronics',
    companyName: 'ABC Electronics',
    active: true,
    primaryEmailAddr: {
      address: 'purchasing@abcelectronics.com'
    },
    primaryPhone: {
      freeFormNumber: '555-987-6543'
    },
    billAddr: {
      line1: '456 Electronics Ave',
      city: 'Circuit City',
      country: 'USA',
      postalCode: '67890'
    },
    metadata: {
      lastUpdatedTime: '2025-04-20T11:22:00Z'
    }
  },
  {
    id: '3',
    displayName: 'Global Systems',
    companyName: 'Global Systems',
    active: true,
    primaryEmailAddr: {
      address: 'info@globalsystems.com'
    },
    primaryPhone: {
      freeFormNumber: '555-222-3333'
    },
    billAddr: {
      line1: '789 Global Blvd',
      city: 'Globalville',
      country: 'USA',
      postalCode: '54321'
    },
    metadata: {
      lastUpdatedTime: '2025-04-18T16:40:00Z'
    }
  }
];

/**
 * GET /api/integrations/quickbooks/customers
 * Get customers from QuickBooks
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
    let filteredCustomers = [...quickbooksCustomers];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.displayName.toLowerCase().includes(searchLower) ||
        customer.companyName.toLowerCase().includes(searchLower) ||
        customer.primaryEmailAddr?.address.toLowerCase().includes(searchLower)
      );
    }
    
    if (active === 'true') {
      filteredCustomers = filteredCustomers.filter(customer => customer.active);
    } else if (active === 'false') {
      filteredCustomers = filteredCustomers.filter(customer => !customer.active);
    }
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + pageSize);
    
    // Return response
    return NextResponse.json(
      createPaginatedResponse(paginatedCustomers, page, pageSize, filteredCustomers.length)
    );
  } catch (error) {
    return handleApiError(error);
  }
}