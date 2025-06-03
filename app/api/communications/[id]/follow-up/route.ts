import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { negotiationCommunications } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

    const { followUpCompleted } = body;

    // Check if communication exists
    const [existingComm] = await db
      .select({ 
        id: negotiationCommunications.id,
        followUpRequired: negotiationCommunications.followUpRequired 
      })
      .from(negotiationCommunications)
      .where(eq(negotiationCommunications.id, communicationId));

    if (!existingComm) {
      return NextResponse.json(
        { success: false, error: 'Communication not found' },
        { status: 404 }
      );
    }
    if (!existingComm.followUpRequired) {
      return NextResponse.json(
        { success: false, error: 'This communication does not require follow-up' },
        { status: 400 }
      );
    }

    // Update follow-up status
    const [updatedCommunication] = await db
      .update(negotiationCommunications)
      .set({
        followUpCompleted: followUpCompleted,
        followUpCompletedAt: followUpCompleted ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(negotiationCommunications.id, communicationId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedCommunication,
    });
  } catch (error) {
    console.error('Error updating follow-up status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update follow-up status' },
      { status: 500 }
    );
  }
}
