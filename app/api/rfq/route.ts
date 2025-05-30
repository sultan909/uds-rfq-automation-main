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
import { db } from '../../../db';
import { rfqs, customers, users, rfqItems } from '../../../db/schema';
import { eq, and, like, gte, lte, desc, sql, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface TransformedRfq {
  id: number;
  rfqNumber: string;
  title: string;
  description: string;
  requestorId: number;
  customerId: number;
  vendorId: number | null;
  status: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "COMPLETED";
  source: string;
  notes: string | null;
  dueDate: Date | null;
  totalBudget: number | null;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    id: number;
    name: string;
    email: string;
    type: string;
  };
  requestor: {
    id: number;
    name: string;
    email: string;
  };
  items: any[];
  itemCount: number;
}

/**
 * GET /api/rfq/list
 * Get all RFQs with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    
    const searchParams = request.nextUrl.searchParams;
    
    // Extract filter parameters
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    // Extract pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10) || 10));
    
    // Build query conditions
    const conditions = [];
    if (status) conditions.push(eq(rfqs.status, status as 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'COMPLETED'));
    if (customerId) conditions.push(eq(rfqs.customerId, parseInt(customerId)));
    if (search) {
      conditions.push(
        like(rfqs.rfqNumber, `%${search}%`)
      );
    }
    if (dateFrom) conditions.push(gte(rfqs.createdAt, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(rfqs.createdAt, new Date(dateTo)));

    // Get total count
    const totalCount = await db
      .select({ value: count() })
      .from(rfqs)
      .where(and(...conditions))
      .then(result => result[0].value);

    // Get paginated RFQs with related data
    const rfqList = await db
      .select({
        rfq: {
          ...rfqs,
          itemCount: sql<number>`(SELECT COUNT(*) FROM rfq_items WHERE rfq_id = ${rfqs.id})` as unknown as number
        },
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          type: customers.type
        },
        requestor: {
          id: users.id,
          name: users.name,
          email: users.email
        }
      })
      .from(rfqs)
      .leftJoin(customers, eq(rfqs.customerId, customers.id))
      .leftJoin(users, eq(rfqs.requestorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(rfqs.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Transform the data to match the expected format
    const transformedRfqs = rfqList.map(item => ({
      ...item.rfq,
      customer: item.customer,
      requestor: item.requestor,
      items: [],
      itemCount: (item.rfq as any).itemCount
    } as TransformedRfq));
    
    // Return response
    return NextResponse.json(
      createPaginatedResponse(transformedRfqs, page, pageSize, totalCount)
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// Remove the duplicate POST endpoint since we have a proper one in app/api/rfq/create/route.ts