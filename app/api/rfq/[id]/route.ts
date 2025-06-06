import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createPaginatedResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { rfqs, customers, users, rfqItems, inventoryItems, auditLog, salesHistory } from '../../../../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

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
    cost: number | null;
    costCurrency: string;
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
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const offset = (page - 1) * pageSize;

    // Get RFQ with related data
    const rfqData = await db
      .select({
        rfq: {
          id: rfqs.id,
          rfqNumber: rfqs.rfqNumber,
          status: rfqs.status,
          source: rfqs.source,
          dueDate: rfqs.dueDate,
          totalBudget: rfqs.totalBudget,
          createdAt: rfqs.createdAt,
          updatedAt: rfqs.updatedAt,
          customerId: rfqs.customerId,
          requestorId: rfqs.requestorId
        },
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
      .then((result: any[]) => result[0]);

    if (!rfqData) {
      throw new ApiError(`RFQ with ID ${id} not found`, 404);
    }

    // Get total count of items
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(rfqItems)
      .where(eq(rfqItems.rfqId, parseInt(id)));

    // Get paginated RFQ items with inventory data
    const items = await db
      .select({
        item: rfqItems,
        inventory: {
          id: inventoryItems.id,
          sku: inventoryItems.sku,
          description: inventoryItems.description,
          stock: inventoryItems.stock,
          cost: inventoryItems.cost,
          costCurrency: inventoryItems.costCurrency,
          quantityOnHand: inventoryItems.quantityOnHand,
          quantityReserved: inventoryItems.quantityReserved,
          warehouseLocation: inventoryItems.warehouseLocation,
          lowStockThreshold: inventoryItems.lowStockThreshold,
          lastSaleDate: inventoryItems.lastSaleDate,
          brand: inventoryItems.brand,
          mpn: inventoryItems.mpn
        }
      })
      .from(rfqItems)
      .leftJoin(inventoryItems, eq(rfqItems.internalProductId, inventoryItems.id))
      .where(eq(rfqItems.rfqId, parseInt(id)))
      .limit(pageSize)
      .offset(offset);

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
      .orderBy(desc(auditLog.timestamp));

    // Create paginated response
    const response = {
      success: true,
      data: {
        ...rfqData.rfq,
        customer: rfqData.customer,
        requestor: rfqData.requestor,
        items: items.map((item: any) => ({
          ...item.item,
          inventory: item.inventory
        })),
        changeHistory: auditLogEntries.map((log: any) => ({
          timestamp: log.timestamp,
          user: log.userId ? 'User ' + log.userId : 'System',
          action: log.action
        }))
      },
      meta: {
        pagination: {
          page,
          pageSize,
          totalItems: count,
          totalPages: Math.ceil(count / pageSize)
        }
      }
    };

    console.log('Sending API response:', response);
    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/rfq/:id
 * Update a specific RFQ
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log("PATCH RFQ Body:", body);

    // Validate the RFQ ID
    const rfqId = parseInt(id);
    if (isNaN(rfqId)) {
      throw new ApiError(`Invalid RFQ ID: ${id}`, 400);
    }

    // Check if RFQ exists
    const existingRfq = await db
      .select()
      .from(rfqs)
      .where(eq(rfqs.id, rfqId))
      .then((result: typeof rfqs.$inferSelect[]) => result[0]);

    if (!existingRfq) {
      throw new ApiError(`RFQ with ID ${id} not found`, 404);
    }

    console.log("Existing RFQ found:", existingRfq);

    // Prepare update data
    const updateData: Partial<typeof rfqs.$inferInsert> = {
      updatedAt: new Date()
    };

    // Only include valid fields for update
    if (body.status !== undefined) {
      // Validate status
      const validStatuses = ['NEW', 'DRAFT', 'PRICED', 'SENT', 'NEGOTIATING', 'ACCEPTED', 'DECLINED', 'PROCESSED'];
      if (!validStatuses.includes(body.status)) {
        throw new ApiError(`Invalid status: ${body.status}. Valid statuses are: ${validStatuses.join(', ')}`, 400);
      }
      updateData.status = body.status;
    }

    if (body.source !== undefined) updateData.source = body.source;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate;
    if (body.totalBudget !== undefined) updateData.totalBudget = body.totalBudget;
    if (body.notes !== undefined) updateData.notes = body.notes;

    console.log("Update data:", updateData);

    // Update RFQ
    const [updatedRfq] = await db
      .update(rfqs)
      .set(updateData)
      .where(eq(rfqs.id, rfqId))
      .returning();

    console.log("RFQ updated successfully:", updatedRfq);

    // Log the update in audit log
    try {
      await db.insert(auditLog).values({
        userId: body.updatedBy || null,
        action: 'RFQ Updated',
        entityType: 'rfq',
        entityId: rfqId,
        details: {
          oldStatus: existingRfq.status,
          newStatus: body.status,
          changes: body
        }
      });
      console.log("Audit log entry created");
    } catch (auditError) {
      console.error("Failed to create audit log entry:", auditError);
      // Don't fail the whole operation if audit log fails
    }

    // If status is updated to APPROVED, COMPLETED, or ACCEPTED, create sales history entries
    if (body.status === 'APPROVED' || body.status === 'COMPLETED' || body.status === 'ACCEPTED') {
      try {
        console.log("Status changed to completion status, creating sales history...");
        
        // Get RFQ items separately for sales history
        const rfqItemsForSales = await db
          .select()
          .from(rfqItems)
          .where(eq(rfqItems.rfqId, rfqId));

        console.log("Found RFQ items for sales:", rfqItemsForSales);

        if (rfqItemsForSales && rfqItemsForSales.length > 0) {
          // Create sales history entries for each item
          const salesHistoryEntries = rfqItemsForSales.map(item => ({
            invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            customerId: existingRfq.customerId,
            productId: item.internalProductId || 1, // Default to 1 if not mapped
            quantity: item.quantity,
            unitPrice: item.finalPrice || item.suggestedPrice || item.estimatedPrice || 0,
            extendedPrice: (item.quantity || 0) * (item.finalPrice || item.suggestedPrice || item.estimatedPrice || 0),
            currency: 'CAD',
            saleDate: new Date().toISOString().split('T')[0],
            quickbooksInvoiceId: `QB-${Date.now()}`
          }));

          console.log("Sales history entries to create:", salesHistoryEntries);

          // Insert sales history entries
          await db.insert(salesHistory).values(salesHistoryEntries);
          console.log("Sales history entries created successfully");
        } else {
          console.log("No RFQ items found for sales history creation");
        }
      } catch (salesError) {
        console.error("Failed to create sales history entries:", salesError);
        // Don't fail the whole operation if sales history creation fails
      }
    }

    return NextResponse.json(createSuccessResponse(updatedRfq));
  } catch (error) {
    console.error("Error in PATCH /api/rfq/[id]:", error);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/rfq/:id
 * Delete an RFQ
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Validate the RFQ ID
    const rfqId = parseInt(id);
    if (isNaN(rfqId)) {
      throw new ApiError(`Invalid RFQ ID: ${id}`, 400);
    }

    // Check if RFQ exists
    const existingRfq = await db
      .select()
      .from(rfqs)
      .where(eq(rfqs.id, rfqId))
      .then((result: typeof rfqs.$inferSelect[]) => result[0]);

    if (!existingRfq) {
      throw new ApiError(`RFQ with ID ${id} not found`, 404);
    }

    // Delete RFQ items first (due to foreign key constraint)
    await db
      .delete(rfqItems)
      .where(eq(rfqItems.rfqId, rfqId));

    // Delete RFQ
    await db
      .delete(rfqs)
      .where(eq(rfqs.id, rfqId));

    // Log the deletion in audit log
    try {
      await db.insert(auditLog).values({
        action: 'RFQ Deleted',
        entityType: 'rfq',
        entityId: rfqId,
        details: { rfqNumber: existingRfq.rfqNumber }
      });
    } catch (auditError) {
      console.error("Failed to create audit log entry for deletion:", auditError);
      // Don't fail the operation if audit log fails
    }

    return NextResponse.json(
      createSuccessResponse({ message: `RFQ ${id} deleted successfully` })
    );
  } catch (error) {
    console.error("Error in DELETE /api/rfq/[id]:", error);
    return handleApiError(error);
  }
}