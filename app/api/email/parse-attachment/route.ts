import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { emailParsingResults, emailSettings, skuMappings, skuVariations, customers } from '../../../../db/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * POST /api/email/parse-attachment
 * Parse Excel/CSV attachments
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new ApiError('No file uploaded', 400);
    }
    
    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type)) {
      throw new ApiError(`Invalid file type: ${file.type}. Allowed types: CSV, Excel (.xlsx, .xls)`, 400);
    }
    
    // In a real application, we would parse the file content to extract RFQ data
    // For the mock implementation, we'll simulate parsing
    
    // Simulate extracting data
    const extractedData = mockExtractDataFromAttachment(file.name);
    
    // Get the email settings
    const settings = await db
      .select()
      .from(emailSettings)
      .then(results => results[0] || null);
    
    // Store the parsing result for audit
    const [parsingResult] = await db
      .insert(emailParsingResults)
      .values({
        subject: `File: ${file.name}`,
        parsedAt: new Date(),
        customerInfo: extractedData.customerInfo,
        items: extractedData.items,
        confidence: extractedData.confidence,
        status: 'PROCESSED',
        notes: `Parsed from attachment: ${file.name} (${file.type})`
      })
      .returning();
    
    // Detect SKU mappings for non-standard SKUs
    const nonStandardSkus = extractedData.items
      .filter(item => !item.sku.match(/^[A-Z0-9]{5,6}X?$/))
      .map(item => item.sku);
    
    // Query for SKU mappings
    const variations = await db
      .select({
        mappingId: skuVariations.mappingId,
        customerId: skuVariations.customerId,
        customerName: customers.name,
        variationSku: skuVariations.variationSku,
        source: skuVariations.source,
      })
      .from(skuVariations)
      .leftJoin(customers, eq(skuVariations.customerId, customers.id))
      .where(inArray(skuVariations.variationSku, nonStandardSkus));
    
    // Get standard SKUs
    const mappingIds = [...new Set(variations.map(v => v.mappingId))];
    const standards = await db
      .select()
      .from(skuMappings)
      .where(inArray(skuMappings.id, mappingIds));
    
    // Create mappings result
    const mappedSkus = nonStandardSkus.map(sku => {
      const matchedVariation = variations.find(v => v.variationSku === sku);
      
      if (!matchedVariation) {
        return {
          sku,
          detected: false,
          message: 'No matching SKU found'
        };
      }
      
      const standardMapping = standards.find(s => s.id === matchedVariation.mappingId);
      
      if (!standardMapping) {
        return {
          sku,
          detected: false,
          message: 'Mapping information not found'
        };
      }
      
      return {
        sku,
        detected: true,
        standardSku: standardMapping.standardSku,
        standardDescription: standardMapping.standardDescription,
        source: matchedVariation.source,
        customerId: matchedVariation.customerId,
        customerName: matchedVariation.customerName
      };
    });
    
    // Return the extracted data
    return NextResponse.json(createSuccessResponse({
      customerInfo: extractedData.customerInfo,
      items: extractedData.items,
      skuMappings: mappedSkus,
      confidence: extractedData.confidence,
      extractedFrom: 'attachment',
      fileName: file.name,
      fileType: file.type,
      parseDate: new Date().toISOString(),
      parsingResultId: parsingResult.id
    }));
  } catch (error) {
    return handleApiError(error);
  }
}

// Helper function to mock extracting data from attachment
function mockExtractDataFromAttachment(fileName: string) {
  // Simulate extracting customer information based on file name
  // In a real implementation, we might look at file content
  const customerInfo = {
    name: fileName.includes('Tech') ? 'Tech Solutions Inc' : 'Unknown Customer',
    email: null,
    identifier: null, // This would be matched to a customer ID in a real implementation
    confidence: 70 // Lower confidence for file name-based extraction
  };
  
  // Simulate extracting items
  const items = [
    {
      sku: 'HP26X',
      description: 'HP 26X High Yield Toner Cartridge',
      quantity: 8,
      price: 115.50,
      originalText: 'Row 1: HP26X, HP 26X High Yield Toner Cartridge, 8, 115.50'
    },
    {
      sku: 'CE255X',
      description: 'HP 55X High Yield Toner Cartridge',
      quantity: 5,
      price: 95.75,
      originalText: 'Row 2: CE255X, HP 55X High Yield Toner Cartridge, 5, 95.75'
    },
    {
      sku: 'CC364X',
      description: 'HP 64X High Yield Toner Cartridge',
      quantity: 3,
      price: 142.50,
      originalText: 'Row 3: CC364X, HP 64X High Yield Toner Cartridge, 3, 142.50'
    }
  ];
  
  // Overall confidence score for the extraction
  const confidence = 90; // Higher confidence for structured data in attachments
  
  return {
    customerInfo,
    items,
    confidence
  };
}