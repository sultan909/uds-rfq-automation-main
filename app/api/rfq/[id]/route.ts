import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { rfqs, customers, users, rfqItems, inventoryItems, auditLog } from '../../../../db/schema';
import { eq, and, desc } from 'drizzle-orm';

interface RouteParams {
  params: {
    id: string;
  };
}

interface RfqData {
  rfq: typeof rfqs.$inferSelect;
  customer: {
    id: number;
    name: string;
    email: string | null;
    type: string;
    phone: string | null;
    address: string | null;
    contactPerson: string | null;
  };
  requestor: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

interface RfqItem {
  item: typeof rfqItems.$inferSelect;
  inventory: {
    id: number;
    sku: string;
    description: string;
    stock: number;
    costCad: number | null;
    costUsd: number | null;
  } | null;
}

interface AuditLogEntry {
  id: number;
  timestamp: Date;
  userId: number | null;
  action: string;
  entityType: string;
  entityId: number;
  details: any;
}

/**
 * GET /api/rfq/:id
 * Get a specific RFQ by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Get RFQ with related data
    const rfqData = await db
      .select({
        rfq: rfqs,
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          type: customers.type,
          phone: customers.phone,
          address: customers.address,
          contactPerson: customers.contactPerson
        },
        requestor: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role
        }
      })
      .from(rfqs)
      .leftJoin(customers, eq(rfqs.customerId, customers.id))
      .leftJoin(users, eq(rfqs.requestorId, users.id))
      .where(eq(rfqs.id, parseInt(id)))
      // @ts-ignore
      .then((result: RfqData[]) => result[0]);

    if (!rfqData) {
      throw new ApiError(`RFQ with ID ${id} not found`, 404);
    }

    // Get RFQ items with inventory data
    const items = await db
      .select({
        item: rfqItems,
        inventory: {
          id: inventoryItems.id,
          sku: inventoryItems.sku,
          description: inventoryItems.description,
          stock: inventoryItems.stock,
          costCad: inventoryItems.costCad,
          costUsd: inventoryItems.costUsd
        }
      })
      .from(rfqItems)
      .leftJoin(inventoryItems, eq(rfqItems.internalProductId, inventoryItems.id))
      .where(eq(rfqItems.rfqId, parseInt(id)))
      .then((result: RfqItem[]) => result);

    // Get audit log entries for this RFQ
    const auditLogEntries = await db
      .select()
      .from(auditLog)
      .where(
        and(
          eq(auditLog.entityType, 'rfq'),
          eq(auditLog.entityId, parseInt(id))
        )
      )
      .orderBy(desc(auditLog.timestamp))
        // @ts-ignore
      .then((result: AuditLogEntry[]) => result);

    // Combine all data
    const responseData = {
      ...rfqData.rfq,
      customer: rfqData.customer,
      requestor: rfqData.requestor,
      items: items.map((item: RfqItem) => ({
        ...item.item,
        inventory: item.inventory
      })),
      changeHistory: auditLogEntries.map((log: AuditLogEntry) => ({
        timestamp: log.timestamp,
        // @ts-ignore
        user: log.userId ? users.find((u: typeof users.$inferSelect) => u.id === log.userId)?.name : 'System',
        action: log.action
      }))
    };

    return NextResponse.json(createSuccessResponse(responseData));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/rfq/:id
 * Update a specific RFQ
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if RFQ exists
    const existingRfq = await db
      .select()
      .from(rfqs)
      .where(eq(rfqs.id, parseInt(id)))
      .then((result: typeof rfqs.$inferSelect[]) => result[0]);

    if (!existingRfq) {
      throw new ApiError(`RFQ with ID ${id} not found`, 404);
    }

    // Update RFQ
    const [updatedRfq] = await db
      .update(rfqs)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(rfqs.id, parseInt(id)))
      .returning();

    // Log the update in audit log
    await db.insert(auditLog).values({
      userId: body.updatedBy,
      action: 'RFQ Updated',
      entityType: 'rfq',
      entityId: parseInt(id),
      details: body
    });

    return NextResponse.json(createSuccessResponse(updatedRfq));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/rfq/:id
 * Delete an RFQ
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Check if RFQ exists
    const existingRfq = await db
      .select()
      .from(rfqs)
      .where(eq(rfqs.id, parseInt(id)))
      .then((result: typeof rfqs.$inferSelect[]) => result[0]);

    if (!existingRfq) {
      throw new ApiError(`RFQ with ID ${id} not found`, 404);
    }

    // Delete RFQ items first (due to foreign key constraint)
    await db
      .delete(rfqItems)
      .where(eq(rfqItems.rfqId, parseInt(id)));

    // Delete RFQ
    await db
      .delete(rfqs)
      .where(eq(rfqs.id, parseInt(id)));

    // Log the deletion in audit log
    await db.insert(auditLog).values({
      action: 'RFQ Deleted',
      entityType: 'rfq',
      entityId: parseInt(id),
      details: { rfqNumber: existingRfq.rfqNumber }
    });

    return NextResponse.json(
      createSuccessResponse({ message: `RFQ ${id} deleted successfully` })
    );
  } catch (error) {
    return handleApiError(error);
  }
}