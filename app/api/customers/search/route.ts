// app/api/customers/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createPaginatedResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { like, or, count, desc } from 'drizzle-orm';

/**
 * GET /api/customers/search
 * Search through customers
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Extract search parameters
    const query = searchParams.get('query');
    if (!query) {
      throw new ApiError('Search query parameter "query" is required', 400);
    }

    // Extract pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    // Build search conditions
    const searchConditions = [
      like(customers.name, `%${query}%`),
      like(customers.email, `%${query}%`),
      like(customers.phone, `%${query}%`),
      like(customers.contactPerson, `%${query}%`)
    ];

    // Get total count
    const totalCount = await db
      .select({ value: count() })
      .from(customers)
      .where(or(...searchConditions))
      .then((result: { value: number }[]) => result[0]?.value || 0);

    // Get paginated results
    const searchResults = await db
      .select()
      .from(customers)
      .where(or(...searchConditions))
      .orderBy(desc(customers.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Return response
    return NextResponse.json(
      createPaginatedResponse(searchResults, page, pageSize, totalCount)
    );
  } catch (error) {
    return handleApiError(error);
  }
}