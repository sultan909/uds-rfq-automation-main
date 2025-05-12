import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createPaginatedResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';

// Mock data for reports
const reports = [
  {
    id: '1',
    name: 'Monthly Sales Report',
    description: 'Sales performance for the current month',
    type: 'sales',
    createdAt: '2025-04-01T10:00:00Z',
    updatedAt: '2025-04-01T10:00:00Z',
    filters: {
      dateRange: {
        from: '2025-04-01',
        to: '2025-04-30'
      }
    }
  },
  {
    id: '2',
    name: 'Customer Performance Report',
    description: 'RFQ and sales performance by customer',
    type: 'customer',
    createdAt: '2025-03-15T14:30:00Z',
    updatedAt: '2025-03-15T14:30:00Z',
    filters: {
      customerType: 'all'
    }
  },
  {
    id: '3',
    name: 'Inventory Status Report',
    description: 'Current inventory status and low stock alerts',
    type: 'inventory',
    createdAt: '2025-04-10T09:15:00Z',
    updatedAt: '2025-04-10T09:15:00Z',
    filters: {
      includeOutOfStock: true,
      includeLowStock: true
    }
  }
];

/**
 * GET /api/reports/list
 * Get saved reports
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract filter parameters
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    
    // Extract pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    
    // Apply filtering
    let filteredReports = [...reports];
    
    if (type) {
      filteredReports = filteredReports.filter(report => report.type === type);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredReports = filteredReports.filter(report => 
        report.name.toLowerCase().includes(searchLower) ||
        report.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedReports = filteredReports.slice(startIndex, startIndex + pageSize);
    
    // Return response
    return NextResponse.json(
      createPaginatedResponse(paginatedReports, page, pageSize, filteredReports.length)
    );
  } catch (error) {
    return handleApiError(error);
  }
}