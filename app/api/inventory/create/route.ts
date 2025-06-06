import { NextRequest, NextResponse } from "next/server"
import { createSuccessResponse, handleApiError } from "@/lib/api-response"
import { db } from "../../../../db"
import { inventoryItems } from "../../../../db/schema"
import { eq } from "drizzle-orm"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sku,
      mpn,
      brand,
      category,
      description,
      stock,
      cost,
      costCurrency,
      warehouseLocation,
      quantityOnHand,
      quantityReserved,
      lowStockThreshold,
      quickbooksItemId
    } = body

    // Validate required fields
    if (!sku || !mpn || !brand || !description || !category) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if SKU already exists
    const existingItem = await db.query.inventoryItems.findFirst({
      where: eq(inventoryItems.sku, sku),
    })

    if (existingItem) {
      return NextResponse.json(
        { success: false, message: "SKU already exists" },
        { status: 400 }
      )
    }

    // Create new inventory item
    const [newItem] = await db
      .insert(inventoryItems)
      .values({
        sku,
        mpn,
        brand,
        category,
        description,
        stock: stock || 0,
        cost,
        costCurrency: costCurrency || 'CAD',
        warehouseLocation,
        quantityOnHand: quantityOnHand || 0,
        quantityReserved: quantityReserved || 0,
        lowStockThreshold: lowStockThreshold || 5,
        quickbooksItemId
      })
      .returning()

    return NextResponse.json(createSuccessResponse(newItem), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
} 