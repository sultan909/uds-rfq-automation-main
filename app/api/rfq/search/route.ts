import { NextRequest, NextResponse } from 'next/server';
import { createPaginatedResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { rfqs, customers, users } from '../../../../db/schema';
import { eq, and, like, ilike, gte, lte, desc, asc, or, sql, count, isNotNull } from 'drizzle-orm';
import { withRateLimitedHandler, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter';

/**
 * GET /api/rfq/search - Search through RFQs with database backend
 */
async function searchHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;    
    
    // Extract search parameters
    const query = searchParams.get('query');
    if (!query || query.trim() === '') {
      throw new ApiError('Search query is required', 400);
    }
    
    // Extract additional filter parameters
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    // Extract sorting parameters
    const sortField = searchParams.get('sortField');
    const sortOrder = searchParams.get('sortOrder');
    
    // Extract pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10) || 10));
    
    // Build search conditions with enum casting
    const searchQuery = query.trim();
    const searchConditions = or(
      ilike(rfqs.rfqNumber, `%${searchQuery}%`),
      ilike(rfqs.source, `%${searchQuery}%`),
      ilike(sql`${rfqs.status}::text`, `%${searchQuery}%`), // Cast enum to text
      ilike(customers.name, `%${searchQuery}%`),
      ilike(sql`${customers.type}::text`, `%${searchQuery}%`) // Cast enum to text
    );
    
    // Build additional filter conditions
    const conditions = [searchConditions];
    if (status) {
      conditions.push(eq(rfqs.status, status as any));
    }
    if (customerId) {
      conditions.push(eq(rfqs.customerId, parseInt(customerId)));
    }
    if (dateFrom) {
      conditions.push(gte(rfqs.createdAt, new Date(dateFrom)));
    }
    if (dateTo) {
      conditions.push(lte(rfqs.createdAt, new Date(dateTo)));
    }

    // Simple default sorting
    const orderBy = desc(rfqs.createdAt);

    // Get total count
    const countResult = await db
      .select({ value: count() })
      .from(rfqs)
      .leftJoin(customers, eq(rfqs.customerId, customers.id))
      .leftJoin(users, eq(rfqs.requestorId, users.id))
      .where(and(...conditions));
    
    const totalCount = countResult[0]?.value || 0;

    // Get paginated results
    const offset = (page - 1) * pageSize;
    const searchResults = await db
      .select({
        id: rfqs.id,
        rfqNumber: rfqs.rfqNumber,
        title: rfqs.title,
        description: rfqs.description,
        status: rfqs.status,
        source: rfqs.source,
        totalBudget: rfqs.totalBudget,
        createdAt: rfqs.createdAt,
        updatedAt: rfqs.updatedAt,
        customerId: rfqs.customerId,
        itemCount: sql<number>`(SELECT COUNT(*) FROM rfq_items WHERE rfq_id = ${rfqs.id})`,
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
      .offset(offset);

    return NextResponse.json(
      createPaginatedResponse(searchResults, page, pageSize, totalCount)
    );
    
  } catch (error) {
    return handleApiError(error);
  }
}

// Export the rate-limited handler
export const GET = withRateLimitedHandler(searchHandler, RATE_LIMIT_CONFIGS.READ);