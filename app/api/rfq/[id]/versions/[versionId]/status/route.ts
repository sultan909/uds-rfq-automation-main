import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { quotationVersions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  request: Request,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['NEW', 'DRAFT', 'PRICED', 'SENT', 'ACCEPTED', 'DECLINED', 'NEGOTIATING'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Update version status
    const [updatedVersion] = await db
      .update(quotationVersions)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(quotationVersions.rfqId, parseInt(params.id)),
          eq(quotationVersions.versionNumber, parseInt(params.versionId))
        )
      )
      .returning();

    if (!updatedVersion) {
      return NextResponse.json(
        {
          success: false,
          error: 'Version not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedVersion,
    });
  } catch (error) {
    console.error('Error updating version status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update version status',
      },
      { status: 500 }
    );
  }
} 