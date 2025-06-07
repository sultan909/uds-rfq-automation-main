import { NextRequest, NextResponse } from 'next/server';
import { createPaginatedResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { rfqs, customers, users } from '../../../../db/schema';
import { eq, and, like, gte, lte, desc, sql, count, or } from 'drizzle-orm';

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
 * GET /api/rfq/search - Search through RFQs with database backend
 */
export async function GET(request: NextRequest) {
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
    
    // Extract pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10) || 10));
    
    // Build search conditions - search in RFQ number, customer name, and source
    const searchQuery = query.trim().toLowerCase();
    const searchConditions = or(
      like(rfqs.rfqNumber, `%${searchQuery}%`),
      like(customers.name, `%${searchQuery}%`),
      like(rfqs.source, `%${searchQuery}%`),
      like(rfqs.title, `%${searchQuery}%`),
      like(rfqs.description, `%${searchQuery}%`)
    );
    
    // Build additional filter conditions
    const conditions = [searchConditions];
    if (status) conditions.push(eq(rfqs.status, status as 'NEGOTIATING' | 'DRAFT' | 'ACCEPTED' | 'DECLINED' | 'PROCESSED'));
    if (customerId) conditions.push(eq(rfqs.customerId, parseInt(customerId)));
    if (dateFrom) conditions.push(gte(rfqs.createdAt, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(rfqs.createdAt, new Date(dateTo)));

    // Get total count for search results
    const totalCount = await db
      .select({ value: count() })
      .from(rfqs)
      .leftJoin(customers, eq(rfqs.customerId, customers.id))
      .where(and(...conditions))
      .then(result => result[0].value);

    // Get paginated search results
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
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          type: customers.type
        }
      })
      .from(rfqs)
      .leftJoin(customers, eq(rfqs.customerId, customers.id))
      .where(and(...conditions))
      .orderBy(desc(rfqs.createdAt))
      .limit(pageSize)
      .offset(offset);

    return createPaginatedResponse(searchResults, page, pageSize, totalCount);
  } catch (error) {
    return handleApiError(error);
  }
}