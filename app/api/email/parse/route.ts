import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { db } from '../../../../db';
import { emailParsingResults, emailSettings, skuMappings, skuVariations, customers, inventoryItems } from '../../../../db/schema';
import { eq, inArray, like } from 'drizzle-orm';

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
    const extractedData = await mockExtractDataFromEmail(body);
    
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

// Helper function to extract data from email
async function mockExtractDataFromEmail(email: any) {
  // Extract customer information from email
  const customerInfo = {
    name: extractCustomerName(email),
    email: email.from || '',
    identifier: null,
    confidence: calculateConfidence(email)
  };
  
  // Extract items from email content
  const items = await extractItemsFromContent(email.content || '');
  
  // Calculate overall confidence score
  const confidence = calculateConfidence(email);
  
  return {
    customerInfo,
    items,
    confidence
  };
}

// Helper function to extract customer name from email
function extractCustomerName(email: any): string {
  // Try to extract from subject first
  if (email.subject) {
    const subjectMatch = email.subject.match(/from\s+([^,]+)/i);
    if (subjectMatch) return subjectMatch[1].trim();
  }
  
  // Try to extract from sender email
  if (email.from) {
    const emailMatch = email.from.match(/^([^<]+)/);
    if (emailMatch) return emailMatch[1].trim();
  }
  
  return 'Unknown Customer';
}

// Helper function to extract items from email content
async function extractItemsFromContent(content: string) {
  const items = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;
    
    // Try to match SKU patterns
    const skuMatch = line.match(/([A-Z0-9]+(?:-[A-Z0-9]+)*X?)/i);
    if (!skuMatch) continue;
    
    const sku = skuMatch[1].toUpperCase();
    
    // Try to extract quantity
    const qtyMatch = line.match(/(?:qty|quantity|units?|pcs|pieces?)[:\s]*(\d+)/i) || 
                    line.match(/(\d+)\s*(?:qty|quantity|units?|pcs|pieces?)/i) ||
                    line.match(/x\s*(\d+)/i);
    
    const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;
    
    // Try to extract price if present
    const priceMatch = line.match(/(?:price|cost|@)[:\s]*[$]?\s*(\d+(?:\.\d{2})?)/i);
    const price = priceMatch ? parseFloat(priceMatch[1]) : null;

    // Find matching inventory item
    const [matchedItem] = await db
      .select()
      .from(inventoryItems)
      .where(like(inventoryItems.sku, `%${sku}%`))
      .limit(1);
    
    items.push({
      sku,
      description: matchedItem?.description || line.trim(),
      quantity,
      price,
      originalText: line.trim(),
      internalProductId: matchedItem?.id || null,
      inventory: matchedItem ? {
        id: matchedItem.id,
        sku: matchedItem.sku,
        description: matchedItem.description,
        quantityOnHand: matchedItem.quantityOnHand,
        quantityReserved: matchedItem.quantityReserved,
        warehouseLocation: matchedItem.warehouseLocation,
        lowStockThreshold: matchedItem.lowStockThreshold,
        costCad: matchedItem.costCad,
        costUsd: matchedItem.costUsd,
        stock: matchedItem.stock
      } : null
    });
  }
  
  return items;
}

// Helper function to calculate confidence score
function calculateConfidence(email: any): number {
  let score = 0;
  
  // Check if we have basic required fields
  if (email.from) score += 20;
  if (email.subject) score += 20;
  if (email.content) score += 20;
  
  // Check content quality
  if (email.content) {
    const lines = email.content.split('\n');
    const hasSkus = lines.some((line: string) => line.match(/[A-Z0-9]+(?:-[A-Z0-9]+)*X?/i));
    const hasQuantities = lines.some((line: string) => line.match(/\d+\s*(?:qty|quantity|units?|pcs|pieces?)/i));
    
    if (hasSkus) score += 20;
    if (hasQuantities) score += 20;
  }
  
  return score;
}