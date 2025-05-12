import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { RfqService, CustomerService, InventoryService } from '../../lib/mock-db/service';

/**
 * POST /api/reports/generate
 * Generate a custom report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.type) {
      throw new ApiError('Report type is required', 400);
    }
    
    // Generate report based on the type
    let reportData;
    
    switch (body.type) {
      case 'sales':
        reportData = generateSalesReport(body);
        break;
      case 'customer':
        reportData = generateCustomerReport(body);
        break;
      case 'inventory':
        reportData = generateInventoryReport(body);
        break;
      case 'rfq':
        reportData = generateRfqReport(body);
        break;
      default:
        throw new ApiError(`Unsupported report type: ${body.type}`, 400);
    }
    
    // Create a new report object
    const newReport = {
      id: `${Date.now()}`,
      name: body.name || `${body.type.charAt(0).toUpperCase() + body.type.slice(1)} Report`,
      description: body.description || `Generated ${body.type} report`,
      type: body.type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      filters: body.filters || {},
      data: reportData
    };
    
    // In a real application, we would save the report to the database
    // For now, we'll just return it
    
    return NextResponse.json(createSuccessResponse(newReport));
  } catch (error) {
    return handleApiError(error);
  }
}

// Helper function to generate sales report
function generateSalesReport(params: any) {
  // Get all RFQs
  const allRfqs = RfqService.getAll();
  
  // Apply filters
  let filteredRfqs = [...allRfqs];
  
  if (params.filters) {
    if (params.filters.dateRange) {
      const { from, to } = params.filters.dateRange;
      
      if (from) {
        const fromDate = new Date(from);
        filteredRfqs = filteredRfqs.filter(rfq => new Date(rfq.createdAt) >= fromDate);
      }
      
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999); // End of day
        filteredRfqs = filteredRfqs.filter(rfq => new Date(rfq.createdAt) <= toDate);
      }
    }
    
    if (params.filters.status) {
      filteredRfqs = filteredRfqs.filter(rfq => rfq.status === params.filters.status);
    }
  }
  
  // Process RFQs to generate report data
  const completedRfqs = filteredRfqs.filter(rfq => 
    ['accepted', 'processed'].includes(rfq.status)
  );
  
  const totalSalesCAD = completedRfqs.reduce((sum, rfq) => sum + rfq.totalCAD, 0);
  const averageSaleCAD = completedRfqs.length > 0 ? totalSalesCAD / completedRfqs.length : 0;
  
  // Extract data for time series chart
  const salesByDate: Record<string, number> = {};
  
  completedRfqs.forEach(rfq => {
    const date = rfq.date;
    
    if (!salesByDate[date]) {
      salesByDate[date] = 0;
    }
    
    salesByDate[date] += rfq.totalCAD;
  });
  
  const timeSeriesData = Object.entries(salesByDate)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return {
    summary: {
      totalRfqs: filteredRfqs.length,
      completedRfqs: completedRfqs.length,
      conversionRate: filteredRfqs.length > 0 
        ? (completedRfqs.length / filteredRfqs.length) * 100 
        : 0,
      totalSalesCAD,
      averageSaleCAD
    },
    timeSeriesData,
    currency: 'CAD'
  };
}

// Helper function to generate customer report
function generateCustomerReport(params: any) {
  // Get all customers
  const allCustomers = CustomerService.getAll();
  
  // Get all RFQs
  const allRfqs = RfqService.getAll();
  
  // Apply filters
  let filteredCustomers = [...allCustomers];
  
  if (params.filters) {
    if (params.filters.customerType && params.filters.customerType !== 'all') {
      filteredCustomers = filteredCustomers.filter(
        customer => customer.type === params.filters.customerType
      );
    }
  }
  
  // Process customers to generate report data
  const customerData = filteredCustomers.map(customer => {
    // Get RFQs for this customer
    const customerRfqs = allRfqs.filter(rfq => rfq.customerId === customer.id);
    
    // Calculate metrics
    const totalRfqs = customerRfqs.length;
    const completedRfqs = customerRfqs.filter(rfq => 
      ['accepted', 'processed'].includes(rfq.status)
    ).length;
    const totalSpentCAD = customerRfqs
      .filter(rfq => ['accepted', 'processed'].includes(rfq.status))
      .reduce((sum, rfq) => sum + rfq.totalCAD, 0);
    
    return {
      id: customer.id,
      name: customer.name,
      type: customer.type,
      totalRfqs,
      completedRfqs,
      conversionRate: totalRfqs > 0 ? (completedRfqs / totalRfqs) * 100 : 0,
      totalSpentCAD,
      averageOrderValueCAD: completedRfqs > 0 ? totalSpentCAD / completedRfqs : 0,
      lastOrder: customer.lastOrder
    };
  });
  
  // Sort by total spent
  customerData.sort((a, b) => b.totalSpentCAD - a.totalSpentCAD);
  
  return {
    summary: {
      totalCustomers: filteredCustomers.length,
      totalSpentCAD: customerData.reduce((sum, customer) => sum + customer.totalSpentCAD, 0),
      averageSpentCAD: filteredCustomers.length > 0 
        ? customerData.reduce((sum, customer) => sum + customer.totalSpentCAD, 0) / filteredCustomers.length 
        : 0,
      customerTypeDistribution: {
        Dealer: filteredCustomers.filter(customer => customer.type === 'Dealer').length,
        Wholesaler: filteredCustomers.filter(customer => customer.type === 'Wholesaler').length
      }
    },
    customerData,
    currency: 'CAD'
  };
}

// Helper function to generate inventory report
function generateInventoryReport(params: any) {
  // Get all inventory items
  const allItems = InventoryService.getAll();
  
  // Apply filters
  let filteredItems = [...allItems];
  
  if (params.filters) {
    if (params.filters.includeLowStock === false) {
      filteredItems = filteredItems.filter(item => !item.lowStock);
    }
    
    if (params.filters.includeOutOfStock === false) {
      filteredItems = filteredItems.filter(item => !item.outOfStock);
    }
  }
  
  // Calculate total inventory value
  const totalValueCAD = filteredItems.reduce(
    (sum, item) => sum + (item.stock * item.costCAD), 0
  );
  
  // Get stock status counts
  const inStock = filteredItems.filter(
    item => !item.lowStock && !item.outOfStock
  ).length;
  const lowStock = filteredItems.filter(item => item.lowStock).length;
  const outOfStock = filteredItems.filter(item => item.outOfStock).length;
  
  return {
    summary: {
      totalItems: filteredItems.length,
      totalValueCAD,
      averageValueCAD: filteredItems.length > 0 ? totalValueCAD / filteredItems.length : 0,
      stockStatus: {
        inStock,
        lowStock,
        outOfStock
      }
    },
    inventoryData: filteredItems.map(item => ({
      id: item.id,
      sku: item.sku,
      description: item.description,
      stock: item.stock,
      costCAD: item.costCAD,
      valueCAD: item.stock * item.costCAD,
      lowStock: item.lowStock,
      outOfStock: item.outOfStock,
      lastSale: item.lastSale
    })),
    currency: 'CAD'
  };
}

// Helper function to generate RFQ report
function generateRfqReport(params: any) {
  // Get all RFQs
  const allRfqs = RfqService.getAll();
  
  // Apply filters
  let filteredRfqs = [...allRfqs];
  
  if (params.filters) {
    if (params.filters.dateRange) {
      const { from, to } = params.filters.dateRange;
      
      if (from) {
        const fromDate = new Date(from);
        filteredRfqs = filteredRfqs.filter(rfq => new Date(rfq.createdAt) >= fromDate);
      }
      
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999); // End of day
        filteredRfqs = filteredRfqs.filter(rfq => new Date(rfq.createdAt) <= toDate);
      }
    }
    
    if (params.filters.status && params.filters.status !== 'all') {
      filteredRfqs = filteredRfqs.filter(rfq => rfq.status === params.filters.status);
    }
    
    if (params.filters.customerId) {
      filteredRfqs = filteredRfqs.filter(rfq => rfq.customerId === params.filters.customerId);
    }
  }
  
  // Status distribution
  const statusCounts: Record<string, number> = {};
  const statuses = ['new', 'draft', 'priced', 'sent', 'negotiating', 'accepted', 'declined', 'processed'];
  
  statuses.forEach(status => {
    statusCounts[status] = filteredRfqs.filter(rfq => rfq.status === status).length;
  });
  
  // Calculate totals
  const totalCAD = filteredRfqs.reduce((sum, rfq) => sum + rfq.totalCAD, 0);
  const averageCAD = filteredRfqs.length > 0 ? totalCAD / filteredRfqs.length : 0;
  
  return {
    summary: {
      totalRfqs: filteredRfqs.length,
      totalValueCAD: totalCAD,
      averageValueCAD: averageCAD,
      statusDistribution: statusCounts
    },
    rfqData: filteredRfqs.map(rfq => {
      // Get customer name
      const customer = CustomerService.getById(rfq.customerId);
      
      return {
        id: rfq.id,
        rfqNumber: rfq.rfqNumber,
        date: rfq.date,
        customerId: rfq.customerId,
        customerName: customer ? customer.name : 'Unknown Customer',
        status: rfq.status,
        itemCount: rfq.items.length,
        totalCAD: rfq.totalCAD
      };
    }),
    currency: 'CAD'
  };
}