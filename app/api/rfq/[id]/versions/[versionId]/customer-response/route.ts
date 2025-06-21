import { NextResponse } from 'next/server';
import { db } from '@/db';
import { customerResponses } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const body = await request.json();
    const { status, comments, requestedChanges } = body;

    const [response] = await db
      .insert(customerResponses)
      .values({
        versionId: parseInt(params.versionId),
        status,
        comments: comments || null,
        requestedChanges: requestedChanges || null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error recording customer response:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to record customer response',
      },
      { status: 500 }
    );
  }
} 