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
import { eq, and, like, gte, lte, desc, asc, sql, count, or, ilike, isNotNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface TransformedRfq {
  id: number;
  rfqNumber: string;
  title: string;
  description: string;
  requestorId: number;
  customerId: number;
  vendorId: number | null;
  status: "NEGOTIATING" | "DRAFT" | "ACCEPTED" | "DECLINED" | "PROCESSED" | "SENT"|'NEW'|'PRICED';
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
 * Get all RFQs with filters, sorting and pagination
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
    
    // Extract sorting parameters
    const sortField = searchParams.get('sortField');
    const sortOrder = searchParams.get('sortOrder'); // 'asc' or 'desc'
    
    // Extract pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10) || 10));
    
    // Build query conditions
    const conditions = [];
    if (status) conditions.push(eq(rfqs.status, status as 'NEGOTIATING' | 'DRAFT' | 'ACCEPTED' | 'DECLINED' | 'PROCESSED'));
    if (customerId) conditions.push(eq(rfqs.customerId, parseInt(customerId)));
    if (search) {
      // Comprehensive search across all relevant fields with proper enum casting
      const searchQuery = search.trim();
      conditions.push(
        or(
          // RFQ specific fields
          ilike(rfqs.rfqNumber, `%${searchQuery}%`),
          ilike(rfqs.source, `%${searchQuery}%`),
          ilike(sql`${rfqs.status}::text`, `%${searchQuery}%`), // Cast enum to text
          and(isNotNull(rfqs.title), ilike(rfqs.title, `%${searchQuery}%`)),
          and(isNotNull(rfqs.description), ilike(rfqs.description, `%${searchQuery}%`)),
          and(isNotNull(rfqs.rejectionReason), ilike(rfqs.rejectionReason, `%${searchQuery}%`)),
          // Customer related fields
          ilike(customers.name, `%${searchQuery}%`),
          ilike(sql`${customers.type}::text`, `%${searchQuery}%`), // Cast enum to text
          and(isNotNull(customers.email), ilike(customers.email, `%${searchQuery}%`)),
          and(isNotNull(customers.phone), ilike(customers.phone, `%${searchQuery}%`)),
          and(isNotNull(customers.contactPerson), ilike(customers.contactPerson, `%${searchQuery}%`)),
          and(isNotNull(customers.region), ilike(customers.region, `%${searchQuery}%`)),
          // User/Requestor related fields
          ilike(users.name, `%${searchQuery}%`),
          and(isNotNull(users.email), ilike(users.email, `%${searchQuery}%`)),
          and(isNotNull(users.department), ilike(users.department, `%${searchQuery}%`)),
          ilike(sql`${users.role}::text`, `%${searchQuery}%`) // Cast enum to text
        )
      );
    }
    if (dateFrom) conditions.push(gte(rfqs.createdAt, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(rfqs.createdAt, new Date(dateTo)));

    // Build sorting
    let orderBy;
    if (sortField && sortOrder) {
      const direction = sortOrder === 'desc' ? desc : asc;
      
      switch (sortField) {
        case 'rfqNumber':
          orderBy = direction(rfqs.rfqNumber);
          break;
        case 'customer.name':
          orderBy = direction(customers.name);
          break;
        case 'createdAt':
          orderBy = direction(rfqs.createdAt);
          break;
        case 'updatedAt':
          orderBy = direction(rfqs.updatedAt);
          break;
        case 'source':
          orderBy = direction(rfqs.source);
          break;
        case 'status':
          orderBy = direction(rfqs.status);
          break;
        case 'totalBudget':
          orderBy = direction(rfqs.totalBudget);
          break;
        case 'itemCount':
          // For itemCount, we'll use a subquery in the order by
          orderBy = direction(sql`(SELECT COUNT(*) FROM rfq_items WHERE rfq_id = ${rfqs.id})`);
          break;
        default:
          orderBy = desc(rfqs.createdAt); // Default sort
      }
    } else {
      orderBy = desc(rfqs.createdAt); // Default sort
    }

    // Get total count
    const totalCount = await db
      .select({ value: count() })
      .from(rfqs)
      .leftJoin(customers, eq(rfqs.customerId, customers.id))
      .leftJoin(users, eq(rfqs.requestorId, users.id))
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
      .orderBy(orderBy)
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