// app/api/sku-mapping/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { skuMappings, skuVariations, customers } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/sku-mapping/export
 * Export all SKU mappings
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv'; // Default to CSV

    if (!['csv', 'json'].includes(format)) {
      throw new ApiError('Invalid format specified. Use "csv" or "json".', 400);
    }

    // Get all mappings from the database
    const mappingsData = await db
      .select()
      .from(skuMappings)
      .orderBy(skuMappings.standardSku);
    
    // Get variations for each mapping
    const allMappings = await Promise.all(
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

    let responseBody: string | object;
    let contentType: string;
    let fileName: string;

    if (format === 'csv') {
      // Generate CSV
      contentType = 'text/csv';
      fileName = `sku_mappings_${new Date().toISOString().split('T')[0]}.csv`;
      let csvContent = 'StandardSKU,StandardDescription,VariationSKU,VariationSource,CustomerName\n';
      allMappings.forEach(mapping => {
        mapping.variations.forEach(variation => {
          // Basic CSV escaping (replace quotes with double quotes)
          const stdDesc = mapping.standardDescription.replace(/"/g, '""');
          const varSrc = variation.source.replace(/"/g, '""');
          const custName = (variation.customerName || 'Unknown').replace(/"/g, '""');
          csvContent += `${mapping.standardSku},"${stdDesc}",${variation.variationSku},"${varSrc}","${custName}"\n`;
        });
      });
      responseBody = csvContent;
    } else { // format === 'json'
      contentType = 'application/json';
      fileName = `sku_mappings_${new Date().toISOString().split('T')[0]}.json`;
      responseBody = createSuccessResponse(allMappings); // Just return the JSON data directly
    }

    if (format === 'json') {
        return NextResponse.json(responseBody);
    } else {
        // For CSV, return text with appropriate headers
        const response = new NextResponse(responseBody as string, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        });
        return response;
    }

  } catch (error) {
    return handleApiError(error);
  }
}