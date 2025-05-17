import { NextRequest, NextResponse } from "next/server"
import { createSuccessResponse, handleApiError } from "@/lib/api-response"
import { db } from "../../../../db"
import { inventoryItems } from "../../../../db/schema"
import { and, eq, like, or, sql } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const lowStock = searchParams.get("lowStock") === "true"
    const outOfStock = searchParams.get("outOfStock") === "true"

    const conditions = []

    if (category && category !== "ALL") {
      conditions.push(eq(inventoryItems.category, category))
    }

    if (search) {
      conditions.push(
        or(
          like(inventoryItems.description, `%${search}%`),
          like(inventoryItems.sku, `%${search}%`),
          like(inventoryItems.mpn, `%${search}%`),
          like(inventoryItems.brand, `%${search}%`)
        )
      )
    }

    if (lowStock) {
      conditions.push(
        and(
          eq(inventoryItems.quantityOnHand, inventoryItems.lowStockThreshold),
          eq(inventoryItems.quantityOnHand, 0)
        )
      )
    }

    if (outOfStock) {
      conditions.push(eq(inventoryItems.quantityOnHand, 0))
    }

    const items = await db
      .select()
      .from(inventoryItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(inventoryItems.updatedAt)

    // Get category counts
    const categoryCounts = await db
      .select({
        category: inventoryItems.category,
        count: sql<number>`count(*)::int`
      })
      .from(inventoryItems)
      .groupBy(inventoryItems.category)

    return createSuccessResponse({
      items,
      categories: categoryCounts
    })
  } catch (error) {
    return handleApiError(error)
  }
} 