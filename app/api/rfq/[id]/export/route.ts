import { NextRequest, NextResponse } from 'next/server';
import { RfqService, CustomerService } from '../../../lib/mock-db/service';
import { createSuccessResponse } from '../../../lib/api-response';
import { handleApiError, ApiError } from '../../../lib/error-handler';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/rfq/:id/export
 * Export an RFQ to PDF/Excel
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const format = request.nextUrl.searchParams.get('format') || 'json';
    
    // Get RFQ
    const rfq = RfqService.getById(id);
    
    // Check if RFQ exists
    if (!rfq) {
      throw new ApiError(`RFQ with ID ${id} not found`, 404);
    }
    
    // Get customer
    const customer = CustomerService.getById(rfq.customerId);
    
    // Combine RFQ and customer data
    const exportData = {
      ...rfq,
      customer: {
        id: customer?.id,
        name: customer?.name,
        email: customer?.email,
        phone: customer?.phone,
        address: customer?.address
      },
      exportDate: new Date().toISOString(),
      format
    };
    
    // In a real application, we would generate the actual export file
    // based on the requested format (PDF, Excel, etc.)
    
    // For the mock implementation, we'll just return the data
    // along with a "downloadUrl" that would normally point to the generated file
    return NextResponse.json(
      createSuccessResponse({
        ...exportData,
        downloadUrl: `/api/downloads/rfq-${id}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}