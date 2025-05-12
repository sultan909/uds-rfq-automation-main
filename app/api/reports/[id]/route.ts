import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';

// Mock data for reports - this would normally be retrieved from a database
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
    },
    data: {
      summary: {
        totalRfqs: 25,
        completedRfqs: 18,
        conversionRate: 72,
        totalSalesCAD: 12500,
        averageSaleCAD: 694.44
      },
      timeSeriesData: [
        { date: '4/01/2025', value: 1250 },
        { date: '4/05/2025', value: 2340 },
        { date: '4/10/2025', value: 1980 },
        { date: '4/15/2025', value: 2560 },
        { date: '4/20/2025', value: 2870 },
        { date: '4/25/2025', value: 1500 }
      ],
      currency: 'CAD'
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
    },
    data: {
      summary: {
        totalCustomers: 5,
        totalSpentCAD: 450350,
        averageSpentCAD: 90070,
        customerTypeDistribution: {
          Dealer: 3,
          Wholesaler: 2
        }
      },
      customerData: [
        {
          id: '5',
          name: 'IJS Globe',
          type: 'Wholesaler',
          totalRfqs: 215,
          completedRfqs: 180,
          conversionRate: 83.72,
          totalSpentCAD: 245780.25,
          averageOrderValueCAD: 1365.45,
          lastOrder: '4/23/2025'
        },
        {
          id: '2',
          name: 'ABC Electronics',
          type: 'Wholesaler',
          totalRfqs: 128,
          completedRfqs: 102,
          conversionRate: 79.69,
          totalSpentCAD: 156420.5,
          averageOrderValueCAD: 1533.53,
          lastOrder: '4/20/2025'
        }
      ],
      currency: 'CAD'
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
    },
    data: {
      summary: {
        totalItems: 5,
        totalValueCAD: 7563.5,
        averageValueCAD: 1512.7,
        stockStatus: {
          inStock: 3,
          lowStock: 1,
          outOfStock: 1
        }
      },
      inventoryData: [
        {
          id: '1',
          sku: 'CF226X',
          description: 'HP 26X High Yield Black Toner',
          stock: 24,
          costCAD: 89.5,
          valueCAD: 2148,
          lowStock: false,
          outOfStock: false,
          lastSale: '4/15/2025'
        }
      ],
      currency: 'CAD'
    }
  }
];

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/reports/:id
 * Get a specific report
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Find the report
    const report = reports.find(r => r.id === id);
    
    if (!report) {
      return NextResponse.json(
        createErrorResponse(`Report with ID ${id} not found`),
        { status: 404 }
      );
    }
    
    return NextResponse.json(createSuccessResponse(report));
  } catch (error) {
    return handleApiError(error);
  }
}