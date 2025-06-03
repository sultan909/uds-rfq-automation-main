import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { negotiationCommunications, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const communicationId = parseInt(id);

    if (isNaN(communicationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid communication ID' },
        { status: 400 }
      );
    }

    const [communication] = await db
      .select({
        id: negotiationCommunications.id,
        rfqId: negotiationCommunications.rfqId,
        versionId: negotiationCommunications.versionId,
        communicationType: negotiationCommunications.communicationType,
        direction: negotiationCommunications.direction,
        subject: negotiationCommunications.subject,
        content: negotiationCommunications.content,
        contactPerson: negotiationCommunications.contactPerson,
        communicationDate: negotiationCommunications.communicationDate,
        followUpRequired: negotiationCommunications.followUpRequired,
        followUpDate: negotiationCommunications.followUpDate,
        enteredByUserId: negotiationCommunications.enteredByUserId,
        createdAt: negotiationCommunications.createdAt,
        updatedAt: negotiationCommunications.updatedAt,
      })
      .from(negotiationCommunications)
      .where(eq(negotiationCommunications.id, communicationId));

    if (!communication) {
      return NextResponse.json(
        { success: false, error: 'Communication not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: communication,
    });
  } catch (error) {
    console.error('Error fetching communication:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch communication' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const communicationId = parseInt(id);
    const body = await request.json();

    if (isNaN(communicationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid communication ID' },
        { status: 400 }
      );
    }

    const {
      communicationType,
      direction,
      subject,
      content,
      contactPerson,
      communicationDate,
      followUpRequired,
      followUpDate,
    } = body;

    // Validate required fields
    if (!content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    // Check if communication exists
    const [existingComm] = await db
      .select({ id: negotiationCommunications.id })
      .from(negotiationCommunications)
      .where(eq(negotiationCommunications.id, communicationId));

    if (!existingComm) {
      return NextResponse.json(
        { success: false, error: 'Communication not found' },
        { status: 404 }
      );
    }

    // Update the communication
    const [updatedCommunication] = await db
      .update(negotiationCommunications)
      .set({
        communicationType: communicationType || undefined,
        direction: direction || undefined,
        subject: subject || null,
        content: content.trim(),
        contactPerson: contactPerson || null,
        communicationDate: communicationDate ? new Date(communicationDate) : undefined,
        followUpRequired: followUpRequired || false,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        updatedAt: new Date(),
      })
      .where(eq(negotiationCommunications.id, communicationId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedCommunication,
    });
  } catch (error) {
    console.error('Error updating communication:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update communication' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const communicationId = parseInt(id);

    if (isNaN(communicationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid communication ID' },
        { status: 400 }
      );
    }

    // Check if communication exists
    const [existingComm] = await db
      .select({ id: negotiationCommunications.id })
      .from(negotiationCommunications)
      .where(eq(negotiationCommunications.id, communicationId));

    if (!existingComm) {
      return NextResponse.json(
        { success: false, error: 'Communication not found' },
        { status: 404 }
      );
    }

    // Delete the communication
    await db
      .delete(negotiationCommunications)
      .where(eq(negotiationCommunications.id, communicationId));

    return NextResponse.json({
      success: true,
      message: 'Communication deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting communication:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete communication' },
      { status: 500 }
    );
  }
}
