import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';
import { SkuMappingService } from '../../lib/mock-db/service';

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
    
    // For the mock implementation, we'll simulate extracting data
    const extractedData = mockExtractDataFromEmail(body);
    
    // Detect SKU mappings for non-standard SKUs
    const nonStandardSkus = extractedData.items
      .filter(item => !item.sku.match(/^[A-Z0-9]{5,6}X?$/))
      .map(item => item.sku);
    
    const mappedSkus = SkuMappingService.detectMappings(nonStandardSkus);
    
    // Return the extracted data
    return NextResponse.json(createSuccessResponse({
      customerInfo: extractedData.customerInfo,
      items: extractedData.items,
      skuMappings: mappedSkus,
      confidence: extractedData.confidence,
      extractedFrom: 'email',
      parseDate: new Date().toISOString()
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