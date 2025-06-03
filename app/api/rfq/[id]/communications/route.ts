import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { negotiationCommunications, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rfqId = parseInt(id);

    if (isNaN(rfqId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid RFQ ID' },
        { status: 400 }
      );
    }

    const communications = await db
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
        followUpCompleted: negotiationCommunications.followUpCompleted,
        followUpCompletedAt: negotiationCommunications.followUpCompletedAt,
        enteredByUserId: negotiationCommunications.enteredByUserId,
        createdAt: negotiationCommunications.createdAt,
        updatedAt: negotiationCommunications.updatedAt,
        enteredByUser: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(negotiationCommunications)
      .leftJoin(users, eq(negotiationCommunications.enteredByUserId, users.id))
      .where(eq(negotiationCommunications.rfqId, rfqId))
      .orderBy(desc(negotiationCommunications.communicationDate));

    return NextResponse.json({
      success: true,
      data: communications,
    });
  } catch (error) {
    console.error('Error fetching communications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch communications' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rfqId = parseInt(id);
    const body = await request.json();

    if (isNaN(rfqId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid RFQ ID' },
        { status: 400 }
      );
    }

    const {
      versionId,
      communicationType,
      direction,
      subject,
      content,
      contactPerson,
      communicationDate,
      followUpRequired,
      followUpDate,
    } = body;

    // For now, use a default user ID (in a real app, get from session)
    const enteredByUserId = 1;

    const [newCommunication] = await db
      .insert(negotiationCommunications)
      .values({
        rfqId,
        versionId: versionId || null,
        communicationType,
        direction,
        subject: subject || null,
        content,
        contactPerson: contactPerson || null,
        communicationDate: new Date(communicationDate),
        followUpRequired: followUpRequired || false,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        enteredByUserId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newCommunication,
    });
  } catch (error) {
    console.error('Error creating communication:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create communication' },
      { status: 500 }
    );
  }
}