// app/api/sku-mapping/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SkuMappingService } from '../../lib/mock-db/service';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';

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

    // Get all mappings
    const allMappings = SkuMappingService.getAll();

    // --- Mock File Generation ---
    // In a real application, you would:
    // 1. Format the `allMappings` data into the requested format (CSV or JSON string).
    // 2. For CSV, create headers and iterate through mappings/variations.
    // 3. Set appropriate Content-Type and Content-Disposition headers.
    // 4. Return the formatted string as the response body.

    let responseBody: string | object;
    let contentType: string;
    let fileName: string;

    if (format === 'csv') {
      // Mock CSV generation
      contentType = 'text/csv';
      fileName = `sku_mappings_${new Date().toISOString().split('T')[0]}.csv`;
      let csvContent = 'StandardSKU,StandardDescription,VariationSKU,VariationSource\n';
      allMappings.forEach(mapping => {
        mapping.variations.forEach(variation => {
          // Basic CSV escaping (replace quotes with double quotes)
          const stdDesc = mapping.standardDescription.replace(/"/g, '""');
          const varSrc = variation.source.replace(/"/g, '""');
          csvContent += `${mapping.standardSku},"${stdDesc}",${variation.sku},"${varSrc}"\n`;
        });
      });
      responseBody = csvContent;
    } else { // format === 'json'
      contentType = 'application/json';
      fileName = `sku_mappings_${new Date().toISOString().split('T')[0]}.json`;
      responseBody = createSuccessResponse(allMappings); // Just return the JSON data directly
    }
    // --- End Mock File Generation ---

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