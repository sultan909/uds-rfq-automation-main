import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { withAuth } from '@/lib/auth-middleware';
import { type User } from '@/lib/auth';
import { db } from '../../../../db';
import { customers } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/customers/:id
 * Get a specific customer by ID
 */
async function getCustomerHandler(request: NextRequest, context: Promise<RouteParams>, user: User) {
  try {
    const { params } = await context;
    const { id } = await params;
    // Get customer
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, parseInt(id)))
      .then((result) => result[0]);
    // Check if customer exists
    if (!customer) {
      throw new ApiError(`Customer with ID ${id} not found`, 404);
    }
    // Return response
    return NextResponse.json(createSuccessResponse(customer));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/customers/:id
 * Update a specific customer
 */
async function updateCustomerHandler(request: NextRequest, context: Promise<RouteParams>, user: User) {
  try {
    const { params } = await context;
    const { id } = params;
    const body = await request.json();
    // Check if customer exists
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, parseInt(id)))
      .then((result) => result[0]);
    if (!existingCustomer) {
      throw new ApiError(`Customer with ID ${id} not found`, 404);
    }
    // Update customer
    const [updatedCustomer] = await db
      .update(customers)
      .set(body)
      .where(eq(customers.id, parseInt(id)))
      .returning();
    // Return response
    return NextResponse.json(createSuccessResponse(updatedCustomer));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/customers/:id
 * Delete a customer
 */
async function deleteCustomerHandler(request: NextRequest, context: Promise<RouteParams>, user: User) {
  try {
    const { params } = await context;
    const { id } = params;
    // Check if customer exists
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, parseInt(id)))
      .then((result) => result[0]);
    if (!existingCustomer) {
      throw new ApiError(`Customer with ID ${id} not found`, 404);
    }
    // Delete customer
    await db
      .delete(customers)
      .where(eq(customers.id, parseInt(id)));
    // Return success response
    return NextResponse.json(
      createSuccessResponse({ message: `Customer ${id} deleted successfully` })
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// Export the authenticated handlers
export const GET = withAuth(getCustomerHandler);
export const PATCH = withAuth(updateCustomerHandler);
export const DELETE = withAuth(deleteCustomerHandler);