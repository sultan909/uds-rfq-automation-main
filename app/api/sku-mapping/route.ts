import { NextRequest, NextResponse } from 'next/server';
import { createPaginatedResponse, createSuccessResponse } from '../lib/api-response';
import { handleApiError, ApiError } from '../lib/error-handler';
import { db } from '../../../db';
import { skuMappings, skuVariations, customers } from '../../../db/schema';
import { eq, like, or, count, desc, and } from 'drizzle-orm';

// Type definition for variation
interface Variation {
  customerId: number;
  sku: string;
  source: string;
}

/**
 * GET /api/sku-mapping
 * Get all SKU mappings with optional filtering and pagination
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
      conditions.push(or(
        like(skuMappings.standardSku, `%${search}%`),
        like(skuMappings.standardDescription, `%${search}%`)
      ));
    }
    
    // Get total count
    const totalCount = await db
      .select({ value: count() })
      .from(skuMappings)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .then((result) => result[0]?.value || 0);
    
    // Get paginated mappings
    const mappingsData = await db
      .select()
      .from(skuMappings)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(skuMappings.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    
    // Get variations for each mapping
    const mappingsWithVariations = await Promise.all(
      mappingsData.map(async (mapping) => {
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
        
        return {
          ...mapping,
          variations
        };
      })
    );
    
    // Return response
    return NextResponse.json(
      createPaginatedResponse(mappingsWithVariations, page, pageSize, totalCount)
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/sku-mapping
 * Create a new SKU mapping
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.standardSku) {
      throw new ApiError('Standard SKU is required');
    }
    
    if (!body.standardDescription) {
      throw new ApiError('Standard description is required');
    }
    
    if (!body.variations || !Array.isArray(body.variations) || body.variations.length === 0) {
      throw new ApiError('At least one variation is required');
    }
    
    // Validate variations
    for (const variation of body.variations) {
      if (!variation.sku) {
        throw new ApiError('SKU is required for all variations');
      }
      
      if (!variation.source) {
        throw new ApiError('Source is required for all variations');
      }
      
      if (!variation.customerId) {
        throw new ApiError('Customer ID is required for all variations');
      }
    }
    
    // Check if the standard SKU already exists
    const existingMapping = await db
      .select()
      .from(skuMappings)
      .where(eq(skuMappings.standardSku, body.standardSku))
      .then(results => results[0]);
    
    if (existingMapping) {
      throw new ApiError(`SKU mapping with standard SKU "${body.standardSku}" already exists`);
    }
    
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Create the SKU mapping
      const [newMapping] = await tx
        .insert(skuMappings)
        .values({
          standardSku: body.standardSku,
          standardDescription: body.standardDescription
        })
        .returning();
      
      // Create the variations
      const variationInserts = body.variations.map((v: Variation) => ({
        mappingId: newMapping.id,
        customerId: v.customerId,
        variationSku: v.sku,
        source: v.source
      }));
      
      const variations = await tx
        .insert(skuVariations)
        .values(variationInserts)
        .returning();
      
      // Fetch customer names for the response
      const variationsWithCustomers = await Promise.all(
        variations.map(async (variation) => {
          const customer = await tx
            .select({ name: customers.name })
            .from(customers)
            .where(eq(customers.id, variation.customerId))
            .then(results => results[0]);
          
          return {
            ...variation,
            customerName: customer?.name || 'Unknown Customer'
          };
        })
      );
      
      // Prepare the complete response
      const completeMapping = {
        ...newMapping,
        variations: variationsWithCustomers
      };
      
      // Return response
      return NextResponse.json(
        createSuccessResponse(completeMapping),
        { status: 201 }
      );
    });
  } catch (error) {
    return handleApiError(error);
  }
}