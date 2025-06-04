import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers, inventoryItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Fetch active customers
    const customersData = await db
      .select({
        id: customers.id,
        name: customers.name,
        type: customers.type,
        region: customers.region,
        email: customers.email,
        contactPerson: customers.contactPerson,
      })
      .from(customers)
      .where(eq(customers.isActive, true))
      .orderBy(customers.name);

    // Fetch inventory items for SKU lookup
    const inventoryData = await db
      .select({
        id: inventoryItems.id,
        sku: inventoryItems.sku,
        description: inventoryItems.description,
        brand: inventoryItems.brand,
        mpn: inventoryItems.mpn,
        costCad: inventoryItems.costCad,
        costUsd: inventoryItems.costUsd,
      })
      .from(inventoryItems)
      .orderBy(inventoryItems.sku);

    return NextResponse.json({
      success: true,
      data: {
        customers: customersData,
        inventory: inventoryData,
      }
    });

  } catch (error) {
    console.warn('Error fetching RFQ form data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch form data'
    }, { status: 500 });
  }
} 