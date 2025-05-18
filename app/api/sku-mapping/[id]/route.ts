import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { skuMappings, skuVariations, customers } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/sku-mapping/:id
 * Get a specific SKU mapping by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Get mapping
    const mapping = await db
      .select()
      .from(skuMappings)
      .where(eq(skuMappings.id, parseInt(id)))
      .then(results => results[0]);
    
    // Check if mapping exists
    if (!mapping) {
      throw new ApiError(`SKU mapping with ID ${id} not found`, 404);
    }
    
    // Get variations for this mapping
    const variations = await db
      .select({
        id: skuVariations.id,
        mappingId: skuVariations.mappingId,
        customerId: skuVariations.customerId,
        customerName: customers.name,
        variationSku: skuVariations.variationSku,
        source: skuVariations.source,
        createdAt: skuVariations.createdAt,
        updatedAt: skuVariations.updatedAt
      })
      .from(skuVariations)
      .leftJoin(customers, eq(skuVariations.customerId, customers.id))
      .where(eq(skuVariations.mappingId, mapping.id));
    
    // Combine mapping with variations
    const completeMapping = {
      ...mapping,
      variations
    };
    
    // Return response
    return NextResponse.json(createSuccessResponse(completeMapping));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/sku-mapping/:id
 * Update a specific SKU mapping
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Check if mapping exists
    const existingMapping = await db
      .select()
      .from(skuMappings)
      .where(eq(skuMappings.id, parseInt(id)))
      .then(results => results[0]);
    
    if (!existingMapping) {
      throw new ApiError(`SKU mapping with ID ${id} not found`, 404);
    }
    
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Update the mapping
      const updateData: Record<string, any> = {};
      if (body.standardSku !== undefined) updateData.standardSku = body.standardSku;
      if (body.standardDescription !== undefined) updateData.standardDescription = body.standardDescription;
      
      let updatedMapping = existingMapping;
      
      // Only perform update if there are fields to update
      if (Object.keys(updateData).length > 0) {
        // Set the updated timestamp
        updateData.updatedAt = new Date();
        
        // Update the mapping
        const [updated] = await tx
          .update(skuMappings)
          .set(updateData)
          .where(eq(skuMappings.id, parseInt(id)))
          .returning();
          
        updatedMapping = updated;
      }
      
      // Update variations if provided
      if (body.variations && Array.isArray(body.variations) && body.variations.length > 0) {
        // Delete existing variations if replacementMode is true
        if (body.replacementMode === true) {
          await tx
            .delete(skuVariations)
            .where(eq(skuVariations.mappingId, parseInt(id)));
        }
        
        // Process each variation
        for (const variation of body.variations) {
          // For new variations
          if (variation.isNew) {
            // Validate required fields
            if (!variation.sku) throw new ApiError('SKU is required for new variations');
            if (!variation.customerId) throw new ApiError('Customer ID is required for new variations');
            if (!variation.source) throw new ApiError('Source is required for new variations');
            
            // Insert new variation
            await tx
              .insert(skuVariations)
              .values({
                mappingId: parseInt(id),
                customerId: variation.customerId,
                variationSku: variation.sku,
                source: variation.source
              });
          }
          // For updating existing variations
          else if (variation.id) {
            const updateVariationData: Record<string, any> = {};
            if (variation.sku !== undefined) updateVariationData.variationSku = variation.sku;
            if (variation.customerId !== undefined) updateVariationData.customerId = variation.customerId;
            if (variation.source !== undefined) updateVariationData.source = variation.source;
            
            if (Object.keys(updateVariationData).length > 0) {
              // Set updated timestamp
              updateVariationData.updatedAt = new Date();
              
              // Update the variation
              await tx
                .update(skuVariations)
                .set(updateVariationData)
                .where(eq(skuVariations.id, variation.id));
            }
          }
          // For deleting variations
          else if (variation.delete && variation.id) {
            await tx
              .delete(skuVariations)
              .where(eq(skuVariations.id, variation.id));
          }
        }
      }
      
      // Get updated variations
      const updatedVariations = await tx
        .select({
          id: skuVariations.id,
          mappingId: skuVariations.mappingId,
          customerId: skuVariations.customerId,
          customerName: customers.name,
          variationSku: skuVariations.variationSku,
          source: skuVariations.source,
          createdAt: skuVariations.createdAt,
          updatedAt: skuVariations.updatedAt
        })
        .from(skuVariations)
        .leftJoin(customers, eq(skuVariations.customerId, customers.id))
        .where(eq(skuVariations.mappingId, parseInt(id)));
      
      // Prepare the complete response
      const completeMapping = {
        ...updatedMapping,
        variations: updatedVariations
      };
      
      // Return response
      return NextResponse.json(createSuccessResponse(completeMapping));
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/sku-mapping/:id
 * Delete a SKU mapping
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Check if mapping exists
    const existingMapping = await db
      .select()
      .from(skuMappings)
      .where(eq(skuMappings.id, parseInt(id)))
      .then(results => results[0]);
    
    if (!existingMapping) {
      throw new ApiError(`SKU mapping with ID ${id} not found`, 404);
    }
    
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Delete all associated variations first (respecting foreign key constraints)
      await tx
        .delete(skuVariations)
        .where(eq(skuVariations.mappingId, parseInt(id)));
      
      // Delete the mapping
      await tx
        .delete(skuMappings)
        .where(eq(skuMappings.id, parseInt(id)));
      
      // Return success response
      return NextResponse.json(
        createSuccessResponse({ message: `SKU mapping ${id} deleted successfully` })
      );
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/sku-mapping/:id
 * Replace a specific SKU mapping and all its variations
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if mapping exists
    const existingMapping = await db
      .select()
      .from(skuMappings)
      .where(eq(skuMappings.id, parseInt(id)))
      .then(results => results[0]);

    if (!existingMapping) {
      throw new ApiError(`SKU mapping with ID ${id} not found`, 404);
    }

    // Start a transaction
    return await db.transaction(async (tx) => {
      // Update the mapping
      const updateData: Record<string, any> = {};
      if (body.standardSku !== undefined) updateData.standardSku = body.standardSku;
      if (body.standardDescription !== undefined) updateData.standardDescription = body.standardDescription;

      let updatedMapping = existingMapping;

      // Only perform update if there are fields to update
      if (Object.keys(updateData).length > 0) {
        // Set the updated timestamp
        updateData.updatedAt = new Date();

        // Update the mapping
        const [updated] = await tx
          .update(skuMappings)
          .set(updateData)
          .where(eq(skuMappings.id, parseInt(id)))
          .returning();

        updatedMapping = updated;
      }

      // Always replace all variations with the new array
      await tx
        .delete(skuVariations)
        .where(eq(skuVariations.mappingId, parseInt(id)));

      if (body.variations && Array.isArray(body.variations)) {
        for (const variation of body.variations) {
          // Validate required fields
          if (!variation.variationSku) throw new ApiError('variationSku is required');
          if (!variation.customerId) throw new ApiError('customerId is required');
          if (!variation.source) throw new ApiError('source is required');

          await tx
            .insert(skuVariations)
            .values({
              mappingId: parseInt(id),
              customerId: variation.customerId,
              variationSku: variation.variationSku,
              source: variation.source
            });
        }
      }

      // Get updated variations
      const updatedVariations = await tx
        .select({
          id: skuVariations.id,
          mappingId: skuVariations.mappingId,
          customerId: skuVariations.customerId,
          customerName: customers.name,
          variationSku: skuVariations.variationSku,
          source: skuVariations.source,
          createdAt: skuVariations.createdAt,
          updatedAt: skuVariations.updatedAt
        })
        .from(skuVariations)
        .leftJoin(customers, eq(skuVariations.customerId, customers.id))
        .where(eq(skuVariations.mappingId, parseInt(id)));

      // Prepare the complete response
      const completeMapping = {
        ...updatedMapping,
        variations: updatedVariations
      };

      // Return response
      return NextResponse.json(createSuccessResponse(completeMapping));
    });
  } catch (error) {
    return handleApiError(error);
  }
}