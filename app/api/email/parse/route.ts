import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { emailParsingResults, emailSettings, skuMappings, skuVariations, customers } from '../../../../db/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * POST /api/email/parse
 * Parse email content to extract RFQ data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.content && !body.subject) {
      throw new ApiError('Email content or subject is required', 400);
    }
    
    // In a real application, we would use NLP or pattern matching to extract
    // RFQ data from the email content
    
    // For now, we'll simulate extracting data
    const extractedData = mockExtractDataFromEmail(body);
    
    // Get the email settings to determine if we should auto-map SKUs
    const settings = await db
      .select()
      .from(emailSettings)
      .then(results => results[0] || null);
    
    // Store the parsing result for audit
    const [parsingResult] = await db
      .insert(emailParsingResults)
      .values({
        messageId: body.messageId,
        subject: body.subject,
        sender: body.from,
        receivedAt: body.receivedAt || new Date(),
        customerInfo: extractedData.customerInfo,
        items: extractedData.items,
        confidence: extractedData.confidence,
        status: 'PROCESSED'
      })
      .returning();
    
    // Detect SKU mappings for non-standard SKUs
    const nonStandardSkus = extractedData.items
      .filter(item => !item.sku.match(/^[A-Z0-9]{5,6}X?$/))
      .map(item => item.sku);
    
    // Get mappings from database where variation SKUs match
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
      extractedFrom: 'email',
      parseDate: new Date().toISOString(),
      parsingResultId: parsingResult.id
    }));
  } catch (error) {
    return handleApiError(error);
  }
}

// Helper function to mock extracting data from email
function mockExtractDataFromEmail(email: any) {
  // Simulate extracting customer information
  const customerInfo = {
    name: 'Tech Solutions Inc',
    email: email.from || 'orders@techsolutions.com',
    identifier: null, // This would be matched to a customer ID in a real implementation
    confidence: 85 // Confidence score for the extraction
  };
  
  // Simulate extracting items
  const items = [
    {
      sku: 'HP26X',
      description: '',
      quantity: 5,
      price: null,
      originalText: 'HP26X x5'
    },
    {
      sku: 'HP-55-X',
      description: '',
      quantity: 3,
      price: null,
      originalText: 'HP-55-X x3'
    },
    {
      sku: 'CC-364-X',
      description: '',
      quantity: 2,
      price: null,
      originalText: 'CC-364-X x2'
    }
  ];
  
  // Overall confidence score for the extraction
  const confidence = 80;
  
  return {
    customerInfo,
    items,
    confidence
  };
}