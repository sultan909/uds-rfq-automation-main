// app/api/customers/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createPaginatedResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { customers, salesHistory as salesHistoryTable } from '../../../../db/schema';
import { eq, like, and, or, count, desc, sql, inArray } from 'drizzle-orm';

/**
 * GET /api/customers/search
 * Search through customers with pagination and sales history
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Extract search parameters
    const query = searchParams.get('query');
    if (!query || query.trim() === '') {
      throw new ApiError('Search query is required', 400);
    }

    // Extract filter parameters
    const type = searchParams.get('type');

    // Extract pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10) || 10));

    // Build search conditions
    const searchQuery = query.trim();
    const searchConditions = or(
      like(customers.name, `%${searchQuery}%`),
      like(customers.email, `%${searchQuery}%`),
      like(customers.phone, `%${searchQuery}%`),
      like(customers.contactPerson, `%${searchQuery}%`)
    );

    // Build additional filter conditions
    const conditions = [searchConditions];
    const allowedTypes = ['WHOLESALER', 'DEALER', 'RETAILER', 'DIRECT'] as const;
    if (type && allowedTypes.includes(type as any)) {
      conditions.push(eq(customers.type, type as typeof allowedTypes[number]));
    }

    // Get total count
    const totalCount = await db
      .select({ value: count() })
      .from(customers)
      .where(and(...conditions))
      .then((result: { value: number }[]) => result[0]?.value || 0);

    // Get paginated customer list
    const customerList = await db
      .select({
        id: customers.id,
        name: customers.name,
        type: customers.type,
        email: customers.email,
        phone: customers.phone,
        address: customers.address,
        contactPerson: customers.contactPerson,
        quickbooksId: customers.quickbooksId,
        isActive: customers.isActive,
        main_customer: customers.main_customer,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
      })
      .from(customers)
      .where(and(...conditions))
      .orderBy(desc(customers.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    if (customerList.length === 0) {
      return NextResponse.json(
        createPaginatedResponse([], page, pageSize, totalCount)
      );
    }

    // Get customer IDs for batch fetching sales history
    const customerIds = customerList.map(customer => customer.id);
    
    // Fetch sales history for all customers in one efficient query
    const salesHistoryData = await db
      .select({
        customerId: salesHistoryTable.customerId,
        lastOrder: sql<Date | null>`MAX(${salesHistoryTable.saleDate})`,
        totalOrders: sql<number>`COUNT(*)`,
        totalSpentCAD: sql<number>`COALESCE(SUM(CASE 
          WHEN ${salesHistoryTable.currency} = 'CAD' 
          THEN ${salesHistoryTable.extendedPrice} 
          ELSE 0 
        END), 0)`,
        totalSpentUSD: sql<number>`COALESCE(SUM(CASE 
          WHEN ${salesHistoryTable.currency} = 'USD' 
          THEN ${salesHistoryTable.extendedPrice} 
          ELSE 0 
        END), 0)`
      })
      .from(salesHistoryTable)
      .where(inArray(salesHistoryTable.customerId, customerIds))
      .groupBy(salesHistoryTable.customerId);

    // Create a map of customer ID to sales history for efficient lookup
    const salesHistoryMap = new Map(
      salesHistoryData.map(sh => [sh.customerId, {
        lastOrder: sh.lastOrder,
        totalOrders: sh.totalOrders,
        totalSpentCAD: sh.totalSpentCAD,
        totalSpentUSD: sh.totalSpentUSD || 0
      }])
    );

    // Combine customer data with sales history
    const customersWithStats = customerList.map((customer) => {
      const salesData = salesHistoryMap.get(customer.id);
      
      return {
        ...customer,
        lastOrder: salesData?.lastOrder || null,
        totalOrders: salesData?.totalOrders || 0,
        totalSpentCAD: salesData?.totalSpentCAD || 0
      };
    });

    // Return response
    return NextResponse.json(
      createPaginatedResponse(customersWithStats, page, pageSize, totalCount)
    );
  } catch (error) {
    console.error('Customer search API Error:', error);
    return handleApiError(error);
  }
}