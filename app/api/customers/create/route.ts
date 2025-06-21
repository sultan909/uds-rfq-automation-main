import { NextRequest, NextResponse } from "next/server"
import { createSuccessResponse, handleApiError } from "@/lib/api-response"
import { db } from "../../../../db"
import { customers } from "../../../../db/schema"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, type, address, city, state, country, postalCode, notes } = body

    // Validate required fields
    if (!name || !email || !type) {
      return NextResponse.json(
        { success: false, message: "Name, email, and type are required" },
        { status: 400 }
      )
    }

    // Check if customer with same email already exists
    const existingCustomer = await db.query.customers.findFirst({
      where: eq(customers.email, email),
    })

    if (existingCustomer) {
      return NextResponse.json(
        { success: false, message: "Customer with this email already exists" },
        { status: 400 }
      )
    }

    // Create new customer
    const fullAddress = [address, city, state, country, postalCode]
      .filter(Boolean)
      .join(', ');
    
    const [newCustomer] = await db
      .insert(customers)
      .values({
        name,
        email: email || null,
        phone: phone || null,
        type: type.toUpperCase() as any,
        address: fullAddress || null,
        isActive: true,
      })
      .returning()

    return NextResponse.json(createSuccessResponse(newCustomer))
  } catch (error) {
    return handleApiError(error) // This already returns a NextResponse
  }
} 