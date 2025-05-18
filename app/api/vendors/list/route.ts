import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '@/lib/api-response';
import { handleApiError } from '../../lib/error-handler';
import { db } from '@/db';
import { vendors } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

/**
 * GET /api/vendors/list
 * Get all vendors
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching vendors from database...");
    
    const vendorsList = await db
      .select({
        id: vendors.id,
        name: vendors.name,
        email: vendors.email,
        phone: vendors.phone,
        contactPerson: vendors.contactPerson,
        isActive: vendors.isActive
      })
      .from(vendors)
      .where(eq(vendors.isActive, true))
      .orderBy(desc(vendors.name));

    console.log("Retrieved vendors:", vendorsList);

    const response = createSuccessResponse(vendorsList);
    console.log("Sending response:", response);
    
    return response;
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return handleApiError(error);
  }
} 