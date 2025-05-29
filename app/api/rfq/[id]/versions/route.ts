import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quotationVersions, customerResponses } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const versions = await db.query.quotationVersions.findMany({
      where: eq(quotationVersions.rfqId, parseInt(params.id)),
      orderBy: [desc(quotationVersions.versionNumber)],
      with: {
        responses: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    console.error('Error fetching quotation versions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch quotation versions',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { estimatedPrice, finalPrice, changes } = body;

    // Get the latest version number
    const latestVersion = await db.query.quotationVersions.findFirst({
      where: eq(quotationVersions.rfqId, parseInt(params.id)),
      orderBy: [desc(quotationVersions.versionNumber)],
    });

    const [newVersion] = await db.insert(quotationVersions).values({
      rfqId: parseInt(params.id),
      versionNumber: (latestVersion?.versionNumber || 0) + 1,
      status: 'NEW',
      estimatedPrice,
      finalPrice,
      changes,
      createdBy: 'System', // TODO: Get from auth context
    }).returning();

    return NextResponse.json({
      success: true,
      data: newVersion,
    });
  } catch (error) {
    console.error('Error creating quotation version:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create quotation version',
      },
      { status: 500 }
    );
  }
} 