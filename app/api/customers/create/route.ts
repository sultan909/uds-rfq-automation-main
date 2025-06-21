import { NextRequest, NextResponse } from "next/server"
import { createSuccessResponse, createErrorResponse, handleApiError } from "@/lib/api-response"
import { db } from "../../../../db"
import { customers } from "../../../../db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { withAuthAndRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limiter"

// Validation schema for customer creation
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number').optional(),
  type: z.enum(['WHOLESALER', 'DEALER', 'RETAILER', 'DIRECT'], {
    errorMap: () => ({ message: 'Type must be one of: WHOLESALER, DEALER, RETAILER, DIRECT' })
  }),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  contactPerson: z.string().optional(),
  region: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const POST = withAuthAndRateLimit(async (request: NextRequest, context: any, user) => {
  try {
    const bodyData = await request.json();
    
    // Validate input using Zod schema
    const validation = createCustomerSchema.safeParse(bodyData);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse('Invalid input', validation.error.errors),
        { status: 400 }
      );
    }
    
    const body = validation.data;

    // Check if customer with same email already exists (if email provided)
    if (body.email) {
      const existingCustomer = await db.query.customers.findFirst({
        where: eq(customers.email, body.email),
      });

      if (existingCustomer) {
        return NextResponse.json(
          createErrorResponse("Customer with this email already exists"),
          { status: 409 }
        );
      }
    }

    // Create new customer
    const fullAddress = [body.address, body.city, body.state, body.country, body.postalCode]
      .filter(Boolean)
      .join(', ');
    
    const [newCustomer] = await db
      .insert(customers)
      .values({
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        type: body.type as any,
        address: fullAddress || null,
        contactPerson: body.contactPerson || null,
        region: body.region || null,
        isActive: body.isActive,
      })
      .returning()

    return NextResponse.json(
      createSuccessResponse(newCustomer, 'Customer created successfully'),
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}, {
  rateLimit: RATE_LIMIT_CONFIGS.WRITE
}); 