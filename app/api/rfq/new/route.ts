import { NextResponse } from 'next/server';
import { db } from '@/db';
import { customers, inventoryItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Fetch customers
    const customersList = await db.select({
      id: customers.id,
      name: customers.name,
      type: customers.type,
    }).from(customers).where(eq(customers.isActive, true));

    // Fetch inventory items
    const inventoryList = await db.select({
      id: inventoryItems.id,
      sku: inventoryItems.sku,
      description: inventoryItems.description,
      brand: inventoryItems.brand,
      mpn: inventoryItems.mpn,
    }).from(inventoryItems);

    return NextResponse.json({
      success: true,
      data: {
        customers: customersList,
        inventory: inventoryList,
      },
    });
  } catch (error) {
    console.error('Error fetching RFQ form data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch RFQ form data' },
      { status: 500 }
    );
  }
} 