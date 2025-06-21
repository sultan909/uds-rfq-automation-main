import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createPaginatedResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { rfqTemplates } from '../../../../db/schema';
import { eq, like, desc, count, and } from 'drizzle-orm';

/**
 * GET /api/rfq/templates
 * Get all RFQ templates with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extract filter parameters
    const search = searchParams.get('search');
    
    // Extract pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    
    // Build query conditions
    const conditions = [];
    if (search) {
      conditions.push(
        like(rfqTemplates.name, `%${search}%`)
      );
    }

    // Get total count
    const totalCount = await db
      .select({ value: count() })
      .from(rfqTemplates)
      .where(and(...conditions))
      .then(result => result[0].value);

    // Get paginated templates
    const templates = await db
      .select()
      .from(rfqTemplates)
      .where(and(...conditions))
      .orderBy(desc(rfqTemplates.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return NextResponse.json(
      createPaginatedResponse(templates, page, pageSize, totalCount)
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/rfq/templates
 * Create a new RFQ template
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      throw new ApiError('Template name is required');
    }
    
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      throw new ApiError('At least one item is required');
    }

    // Create template
    const [newTemplate] = await db
      .insert(rfqTemplates)
      .values({
        name: body.name,
        description: body.description || null,
        columns: body.items || [],
        createdBy: 1, // Default user ID - should be from auth context
        metadata: body.metadata || null
      })
      .returning();

    return NextResponse.json(
      createSuccessResponse(newTemplate),
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/rfq/templates/:id
 * Update an RFQ template
 */
export async function PATCH(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      throw new ApiError('Template ID is required');
    }

    const body = await request.json();
    
    // Check if template exists
    const existingTemplate = await db
      .select()
      .from(rfqTemplates)
      .where(eq(rfqTemplates.id, parseInt(id)))
      .then(result => result[0]);

    if (!existingTemplate) {
      throw new ApiError(`Template with ID ${id} not found`, 404);
    }

    // Update template
    const [updatedTemplate] = await db
      .update(rfqTemplates)
      .set({
        name: body.name,
        description: body.description,
        columns: body.items,
        metadata: body.metadata
      })
      .where(eq(rfqTemplates.id, parseInt(id)))
      .returning();

    return NextResponse.json(createSuccessResponse(updatedTemplate));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/rfq/templates/:id
 * Delete an RFQ template
 */
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      throw new ApiError('Template ID is required');
    }

    // Check if template exists
    const existingTemplate = await db
      .select()
      .from(rfqTemplates)
      .where(eq(rfqTemplates.id, parseInt(id)))
      .then(result => result[0]);

    if (!existingTemplate) {
      throw new ApiError(`Template with ID ${id} not found`, 404);
    }

    // Delete template
    await db
      .delete(rfqTemplates)
      .where(eq(rfqTemplates.id, parseInt(id)));

    return NextResponse.json(
      createSuccessResponse({ message: `Template ${id} deleted successfully` })
    );
  } catch (error) {
    return handleApiError(error);
  }
}