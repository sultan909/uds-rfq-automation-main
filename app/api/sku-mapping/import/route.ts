// app/api/sku-mapping/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { skuMappings, skuVariations, customers } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

interface MappingData {
  standardSku: string;
  standardDescription: string;
  variations: {
    customerId: number;
    sku: string;
    source: string;
  }[];
}

/**
 * POST /api/sku-mapping/import
 * Import SKU mappings from a file (CSV/Excel)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new ApiError('No file uploaded', 400);
    }

    // Validate file type (simple check based on name/type)
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(file.type) && !['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
       throw new ApiError(`Invalid file type: ${file.type || fileExtension}. Allowed types: CSV, Excel (.xlsx, .xls)`, 400);
    }

    // Read file content
    const fileBuffer = await file.arrayBuffer();
    const fileContent = new TextDecoder().decode(fileBuffer);
    
    // Process file based on type (example for CSV only in this implementation)
    const parsedData = await parseFileContent(fileContent, fileExtension || '');
    
    // Process the data and store in database
    const results = await importMappingsToDatabase(parsedData);

    return NextResponse.json(createSuccessResponse({
      message: 'File processed successfully.',
      results
    }));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Parse file content based on type
 * Currently only handles CSV for simplicity
 */
async function parseFileContent(content: string, fileType: string): Promise<MappingData[]> {
  // Basic CSV parsing: 
  // Expecting format: StandardSKU,StandardDescription,VariationSKU,VariationSource,CustomerID
  if (['csv'].includes(fileType)) {
    const lines = content.split('\n');
    const header = lines[0].toLowerCase();
    
    // Check if header matches expected format
    if (!header.includes('standardsku') || !header.includes('variationsku')) {
      throw new ApiError('Invalid CSV format. Header must include StandardSKU, StandardDescription, VariationSKU, VariationSource, CustomerID');
    }
    
    // Create a map to store mappings with variations
    const mappingsMap = new Map<string, MappingData>();
    
    // Process each line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      // Handle CSV fields properly (respect quoted fields with commas)
      const fields = parseCSVLine(line);
      
      // Basic validation
      if (fields.length < 5) continue;
      
      const standardSku = fields[0]?.trim();
      const standardDescription = fields[1]?.trim();
      const variationSku = fields[2]?.trim();
      const variationSource = fields[3]?.trim();
      const customerIdStr = fields[4]?.trim();
      
      if (!standardSku || !variationSku || !customerIdStr) continue;
      
      const customerId = parseInt(customerIdStr, 10);
      if (isNaN(customerId)) continue;
      
      // Add to mappings map
      if (!mappingsMap.has(standardSku)) {
        mappingsMap.set(standardSku, {
          standardSku,
          standardDescription,
          variations: []
        });
      }
      
      // Add variation
      mappingsMap.get(standardSku)?.variations.push({
        customerId,
        sku: variationSku,
        source: variationSource
      });
    }
    
    return Array.from(mappingsMap.values());
  }
  
  // For other file types - would add parsing for Excel files here
  throw new ApiError(`Parsing for ${fileType} files is not implemented yet`);
}

/**
 * Parse a CSV line respecting quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Handle double quotes inside quoted fields
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // Skip the next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current); // Add the last field
  return result;
}

/**
 * Import mappings to database
 */
async function importMappingsToDatabase(mappingsData: MappingData[]) {
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  
  // Start time
  const startTime = performance.now();
  
  // Process each mapping
  for (const mappingData of mappingsData) {
    try {
      await db.transaction(async (tx) => {
        // Check if mapping already exists
        const existingMapping = await tx
          .select()
          .from(skuMappings)
          .where(eq(skuMappings.standardSku, mappingData.standardSku))
          .then(results => results[0]);
        
        let mappingId: number;
        
        if (existingMapping) {
          // Update existing mapping if description changed
          if (existingMapping.standardDescription !== mappingData.standardDescription) {
            await tx
              .update(skuMappings)
              .set({ standardDescription: mappingData.standardDescription, updatedAt: new Date() })
              .where(eq(skuMappings.id, existingMapping.id));
          }
          
          mappingId = existingMapping.id;
          totalUpdated++;
        } else {
          // Create new mapping
          const [newMapping] = await tx
            .insert(skuMappings)
            .values({
              standardSku: mappingData.standardSku,
              standardDescription: mappingData.standardDescription
            })
            .returning();
          
          mappingId = newMapping.id;
          totalCreated++;
        }
        
        // Process variations
        for (const variation of mappingData.variations) {
          // Check if customer exists
          const customerExists = await tx
            .select()
            .from(customers)
            .where(eq(customers.id, variation.customerId))
            .then(results => results.length > 0);
          
          if (!customerExists) {
            console.warn(`Customer ID ${variation.customerId} does not exist, skipping variation`);
            continue;
          }
          
          // Insert variation
          await tx
            .insert(skuVariations)
            .values({
              mappingId,
              customerId: variation.customerId,
              variationSku: variation.sku,
              source: variation.source
            })
            .onConflictDoUpdate({
              target: [skuVariations.mappingId, skuVariations.customerId, skuVariations.variationSku],
              set: { source: variation.source, updatedAt: new Date() }
            });
        }
      });
    } catch (error) {
      console.error('Error importing mapping:', error);
      totalErrors++;
    }
  }
  
  // End time
  const endTime = performance.now();
  
  return {
    rowsProcessed: mappingsData.length,
    mappingsCreated: totalCreated,
    mappingsUpdated: totalUpdated,
    errors: totalErrors,
    importDurationMs: Math.round(endTime - startTime)
  };
}