import { NextRequest, NextResponse } from 'next/server';
import { createPaginatedResponse, createSuccessResponse } from '../lib/api-response';
import { handleApiError, ApiError } from '../lib/error-handler';
import { db } from '../../../db';
import { customers } from '../../../db/schema';
import { eq, like, and, count, desc } from 'drizzle-orm';

/**
 * GET /api/customers
 * Get all customers with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    // Extract filter parameters
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const main_customer = searchParams.get('main_customer');
    // Extract pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    // Build query conditions
    const conditions = [];
    const allowedTypes = ['WHOLESALER', 'DEALER', 'RETAILER', 'DIRECT'] as const;
    if (type && allowedTypes.includes(type as any)) conditions.push(eq(customers.type, type as typeof allowedTypes[number]));
    if (search) conditions.push(like(customers.name, `%${search}%`));
    if (main_customer === 'true') conditions.push(eq(customers.main_customer, true));
    // Get total count
    const totalCount = await db
      .select({ value: count() })
      .from(customers)
      .where(and(...conditions))
      .then((result: { value: number }[]) => result[0]?.value || 0);
    // Get paginated customers
    const customerList = await db
      .select()
      .from(customers)
      .where(and(...conditions))
      .orderBy(desc(customers.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    return NextResponse.json(
      createPaginatedResponse(customerList, page, pageSize, totalCount)
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/customers
 * Create a new customer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Validate required fields
    if (!body.name) {
      throw new ApiError('Name is required');
    }
    if (!body.type || !['WHOLESALER', 'DEALER', 'RETAILER', 'DIRECT'].includes(body.type)) {
      throw new ApiError('Type must be one of WHOLESALER, DEALER, RETAILER, or DIRECT');
    }
    // Insert new customer
    const [newCustomer] = await db
      .insert(customers)
      .values({
        name: body.name,
        type: body.type,
        region: body.region,
        email: body.email,
        phone: body.phone,
        address: body.address,
        contactPerson: body.contactPerson,
        quickbooksId: body.quickbooksId,
        isActive: body.isActive ?? true
      })
      .returning();
    return NextResponse.json(
      createSuccessResponse(newCustomer),
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}