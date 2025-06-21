import { eq, like, and, count, desc, sql, inArray } from 'drizzle-orm';
import { customers, salesHistory as salesHistoryTable } from '../../../db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { createPaginatedResponse, createSuccessResponse } from '../lib/api-response';
import { handleApiError, ApiError } from '../lib/error-handler';
import { db } from '../../../db';

interface CustomerWithStats {
  id: number;
  name: string;
  type: 'WHOLESALER' | 'DEALER' | 'RETAILER' | 'DIRECT';
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  quickbooksId?: string;
  isActive: boolean;
  main_customer: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastOrder: Date | null;
  totalOrders: number;
  totalSpentCAD: number;
}

/**
 * GET /api/customers
 * Get all customers with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Starting customer fetch request');
    
    const searchParams = request.nextUrl.searchParams;
    // Extract filter parameters
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const main_customer = searchParams.get('main_customer');
    // Extract pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    
    console.log('📋 Request parameters:', { type, search, main_customer, page, pageSize });
    
    // Build query conditions
    const conditions = [];
    const allowedTypes = ['WHOLESALER', 'DEALER', 'RETAILER', 'DIRECT'] as const;
    if (type && allowedTypes.includes(type as any)) {
      conditions.push(eq(customers.type, type as typeof allowedTypes[number]));
    }
    if (search) {
      conditions.push(like(customers.name, `%${search}%`));
    }
    if (main_customer === 'true') {
      conditions.push(eq(customers.main_customer, true));
    }
    
    console.log('🔍 Query conditions:', conditions.length);
    
    // STEP 1: Get total count for pagination
    console.log('📊 Fetching total count...');
    const totalCount = await db
      .select({ value: count() })
      .from(customers)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .then((result: { value: number }[]) => result[0]?.value || 0);
    
    console.log('📈 Total customers found:', totalCount);
    
    if (totalCount === 0) {
      console.log('⚠️ No customers found matching criteria');
      return NextResponse.json(
        createPaginatedResponse([], page, pageSize, 0)
      );
    }

    // STEP 2: Get paginated customers (without sales data first)
    console.log('👥 Fetching customer list...');
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
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(customers.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    console.log('👤 Customers fetched:', customerList.length);

    if (customerList.length === 0) {
      console.log('⚠️ No customers in this page');
      return NextResponse.json(
        createPaginatedResponse([], page, pageSize, totalCount)
      );
    }

    // STEP 3: Get customer IDs for batch fetching sales history
    const customerIds = customerList.map(customer => customer.id);
    console.log('🔢 Customer IDs for sales lookup:', customerIds);
    
    // STEP 4: Fetch sales history for all customers in one efficient query
    console.log('💰 Fetching sales history for customers...');
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

    console.log('📊 Sales history records found:', salesHistoryData.length);
    
    // Log sample sales data for debugging
    if (salesHistoryData.length > 0) {
      console.log('💳 Sample sales data:', {
        customerId: salesHistoryData[0].customerId,
        lastOrder: salesHistoryData[0].lastOrder,
        totalOrders: salesHistoryData[0].totalOrders,
        totalSpentCAD: salesHistoryData[0].totalSpentCAD,
        totalSpentUSD: salesHistoryData[0].totalSpentUSD
      });
    }

    // STEP 5: Create a map of customer ID to sales history for efficient lookup
    console.log('🗺️ Creating sales history lookup map...');
    const salesHistoryMap = new Map(
      salesHistoryData.map(sh => [sh.customerId, {
        lastOrder: sh.lastOrder,
        totalOrders: sh.totalOrders,
        totalSpentCAD: sh.totalSpentCAD,
        totalSpentUSD: sh.totalSpentUSD || 0
      }])
    );

    console.log('📋 Sales history map created with', salesHistoryMap.size, 'entries');

    // STEP 6: Combine customer data with sales history
    console.log('🔗 Combining customer data with sales history...');
    const customersWithStats: CustomerWithStats[] = customerList.map((customer: any, index: number) => {
      const salesData = salesHistoryMap.get(customer.id);
      
      const customerWithStats = {
        ...customer,
        lastOrder: salesData?.lastOrder || null,
        totalOrders: salesData?.totalOrders || 0,
        totalSpentCAD: salesData?.totalSpentCAD || 0
      };
      
      // Log first few customers for debugging
      if (index < 3) {
        console.log(`👤 Customer ${index + 1} combined data:`, {
          id: customerWithStats.id,
          name: customerWithStats.name,
          lastOrder: customerWithStats.lastOrder,
          totalOrders: customerWithStats.totalOrders,
          totalSpentCAD: customerWithStats.totalSpentCAD,
          hasSalesData: salesData ? 'YES' : 'NO'
        });
      }
      
      return customerWithStats;
    });

    // STEP 7: Generate statistics for debugging
    const stats = {
      totalCustomers: customersWithStats.length,
      customersWithSales: customersWithStats.filter(c => c.totalOrders > 0).length,
      customersWithCADSales: customersWithStats.filter(c => c.totalSpentCAD > 0).length,
      customersWithLastOrder: customersWithStats.filter(c => c.lastOrder !== null).length,
      totalRevenue: customersWithStats.reduce((sum, c) => sum + c.totalSpentCAD, 0),
      averageOrdersPerCustomer: customersWithStats.reduce((sum, c) => sum + c.totalOrders, 0) / customersWithStats.length
    };

    console.log('📊 Final statistics:', stats);

    // STEP 8: Return the combined data
    console.log('✅ Successfully returning customer data with sales history');
    
    return NextResponse.json(
      createPaginatedResponse(customersWithStats, page, pageSize, totalCount)
    );
    
  } catch (error:any) {
    console.error('❌ Error in GET /api/customers:', {
      message: error.message,
      stack: error.stack
    });
    return handleApiError(error);
  }
}

/**
 * POST /api/customers
 * Create a new customer
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting customer creation request');
    
    const body = await request.json();
    console.log('📋 Request body:', body);
    
    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      throw new ApiError('Name is required and must be a non-empty string', 400);
    }
    
    if (!body.type || !['WHOLESALER', 'DEALER', 'RETAILER', 'DIRECT'].includes(body.type)) {
      throw new ApiError('Type must be one of WHOLESALER, DEALER, RETAILER, or DIRECT', 400);
    }
    
    // Check for duplicate customer names (optional - remove if not needed)
    const existingCustomer = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.name, body.name.trim()))
      .limit(1);
    
    if (existingCustomer.length > 0) {
      console.log('⚠️ Duplicate customer name detected:', body.name);
      throw new ApiError('Customer with this name already exists', 409);
    }
    
    // Insert new customer
    console.log('💾 Creating new customer...');
    const [newCustomer] = await db
      .insert(customers)
      .values({
        name: body.name.trim(),
        type: body.type,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        address: body.address?.trim() || null,
        contactPerson: body.contactPerson?.trim() || null,
        quickbooksId: body.quickbooksId?.trim() || null,
        isActive: body.isActive ?? true,
        main_customer: body.main_customer ?? false
      })
      .returning();
    
    console.log('✅ Customer created successfully:', {
      id: newCustomer.id,
      name: newCustomer.name,
      type: newCustomer.type
    });
    
    return NextResponse.json(
      createSuccessResponse(newCustomer),
      { status: 201 }
    );
    
  } catch (error:any) {
    console.error('❌ Customer creation error:', {
      message: error.message,
      stack: error.stack
    });
    return handleApiError(error);
  }
}