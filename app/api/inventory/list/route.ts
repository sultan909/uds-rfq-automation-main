import { NextRequest, NextResponse } from "next/server"
import { createSuccessResponse, handleApiError } from "@/lib/api-response"
import { db } from "../../../../db"
import { inventoryItems } from "../../../../db/schema"
import { and, eq, like, or } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const conditions = []

    if (category) {
      conditions.push(eq(inventoryItems.brand, category))
    }

    if (search) {
      conditions.push(
        or(
          like(inventoryItems.description, `%${search}%`),
          like(inventoryItems.sku, `%${search}%`),
          like(inventoryItems.mpn, `%${search}%`)
        )
      )
    }

    const items = await db
      .select()
      .from(inventoryItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    return createSuccessResponse(items)
  } catch (error) {
    return handleApiError(error)
  }
} 