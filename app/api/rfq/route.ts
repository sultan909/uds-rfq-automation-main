// import { NextRequest, NextResponse } from 'next/server';
// import { RfqService } from '../lib/mock-db/service';
// import { createPaginatedResponse, createErrorResponse } from '../lib/api-response';
// import { handleApiError, ApiError } from '../lib/error-handler';
// import { RfqStatus } from '../lib/mock-db/models';

// /**
//  * GET /api/rfq
//  * Get all RFQs with optional filtering and pagination
//  */
// export async function GET(request: NextRequest) {
//   try {
//     const searchParams = request.nextUrl.searchParams;
    
//     // Extract filter parameters
//     const status = searchParams.get('status') as RfqStatus | null;
//     const customerId = searchParams.get('customerId');
//     const search = searchParams.get('search');
//     const dateFrom = searchParams.get('dateFrom');
//     const dateTo = searchParams.get('dateTo');
    
//     // Extract pagination parameters
//     const page = parseInt(searchParams.get('page') || '1', 10);
//     const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    
//     // Apply filtering
//     const filter: any = {};
//     if (status) filter.status = status;
//     if (customerId) filter.customerId = customerId;
//     if (search) filter.search = search;
//     if (dateFrom) filter.dateFrom = dateFrom;
//     if (dateTo) filter.dateTo = dateTo;
    
//     // Get RFQs
//     const allRfqs = RfqService.getAll(filter);
    
//     // Apply pagination
//     const startIndex = (page - 1) * pageSize;
//     const paginatedRfqs = allRfqs.slice(startIndex, startIndex + pageSize);
    
//     // Return response
//     return NextResponse.json(
//       createPaginatedResponse(paginatedRfqs, page, pageSize, allRfqs.length)
//     );
//   } catch (error) {
//     return handleApiError(error);
//   }
// }

// /**
//  * POST /api/rfq
//  * Create a new RFQ
//  */
// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
    
//     // Validate required fields
//     if (!body.customerId) {
//       throw new ApiError('Customer ID is required');
//     }
    
//     if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
//       throw new ApiError('At least one item is required');
//     }
    
//     // Generate RFQ number if not provided
//     if (!body.rfqNumber) {
//       body.rfqNumber = RfqService.generateRfqNumber();
//     }
    
//     // Set default date if not provided
//     if (!body.date) {
//       const today = new Date();
//       const month = today.getMonth() + 1;
//       const day = today.getDate();
//       const year = today.getFullYear();
//       body.date = `${month}/${day}/${year}`;
//     }
    
//     // Set default status if not provided
//     if (!body.status) {
//       body.status = 'new';
//     }
    
//     // Create RFQ
//     const newRfq = RfqService.create(body);
    
//     // Return response
//     return NextResponse.json(
//       { success: true, data: newRfq, error: null },
//       { status: 201 }
//     );
//   } catch (error) {
//     return handleApiError(error);
//   }
// }

import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createPaginatedResponse } from '../lib/api-response';
import { handleApiError, ApiError } from '../lib/error-handler';
import { RfqService } from '../lib/mock-db/service';

/**
 * GET /api/rfq/list
 * Get all RFQs with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract filter parameters
    const status = searchParams.get('status') as any;
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    // Extract pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    
    // Apply filtering
    const filter: any = {};
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (search) filter.search = search;
    if (dateFrom) filter.dateFrom = dateFrom;
    if (dateTo) filter.dateTo = dateTo;
    
    // Get RFQs
    const allRfqs = RfqService.getAll(filter);
    
    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedRfqs = allRfqs.slice(startIndex, startIndex + pageSize);
    
    // Return response
    return NextResponse.json(
      createPaginatedResponse(paginatedRfqs, page, pageSize, allRfqs.length)
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/rfq/create
 * Create a new RFQ
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.customerId) {
      throw new ApiError('Customer ID is required');
    }
    
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      throw new ApiError('At least one item is required');
    }
    
    // Generate RFQ number if not provided
    if (!body.rfqNumber) {
      body.rfqNumber = RfqService.generateRfqNumber();
    }
    
    // Set default date if not provided
    if (!body.date) {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const year = today.getFullYear();
      body.date = `${month}/${day}/${year}`;
    }
    
    // Set default status if not provided
    if (!body.status) {
      body.status = 'new';
    }
    
    // Create RFQ
    const newRfq = RfqService.create(body);
    
    // Return response
    return NextResponse.json(
      createSuccessResponse(newRfq),
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}