// import { NextRequest, NextResponse } from 'next/server';
// import { RfqService, CustomerService } from '../../lib/mock-db/service';
// import { createSuccessResponse } from '../../lib/api-response';
// import { handleApiError, ApiError } from '../../lib/error-handler';

// interface RouteParams {
//   params: {
//     id: string;
//   };
// }

// /**
//  * GET /api/rfq/:id
//  * Get a specific RFQ by ID
//  */
// export async function GET(request: NextRequest, { params }: RouteParams) {
//   try {
//     const { id } = params;
    
//     // Get RFQ
//     const rfq = RfqService.getById(id);
    
//     // Check if RFQ exists
//     if (!rfq) {
//       throw new ApiError(`RFQ with ID ${id} not found`, 404);
//     }
    
//     // Get customer
//     const customer = CustomerService.getById(rfq.customerId);
    
//     // Combine RFQ and customer data
//     const responseData = {
//       ...rfq,
//       customer
//     };
    
//     // Return response
//     return NextResponse.json(createSuccessResponse(responseData));
//   } catch (error) {
//     return handleApiError(error);
//   }
// }

// /**
//  * PATCH /api/rfq/:id
//  * Update a specific RFQ
//  */
// export async function PATCH(request: NextRequest, { params }: RouteParams) {
//   try {
//     const { id } = params;
//     const body = await request.json();
    
//     // Check if RFQ exists
//     const existingRfq = RfqService.getById(id);
//     if (!existingRfq) {
//       throw new ApiError(`RFQ with ID ${id} not found`, 404);
//     }
    
//     // Update RFQ
//     const updatedRfq = RfqService.update(id, body);
    
//     // Return response
//     return NextResponse.json(createSuccessResponse(updatedRfq));
//   } catch (error) {
//     return handleApiError(error);
//   }
// }

// /**
//  * DELETE /api/rfq/:id
//  * Delete an RFQ (not implemented in the mock service)
//  */
// export async function DELETE(request: NextRequest, { params }: RouteParams) {
//   try {
//     // In a real implementation, we would delete the RFQ
//     // For the mock implementation, we'll just return a success message
    
//     const { id } = params;
    
//     // Check if RFQ exists
//     const existingRfq = RfqService.getById(id);
//     if (!existingRfq) {
//       throw new ApiError(`RFQ with ID ${id} not found`, 404);
//     }
    
//     // Return success response
//     return NextResponse.json(
//       createSuccessResponse({ message: `RFQ ${id} deleted successfully` })
//     );
//   } catch (error) {
//     return handleApiError(error);
//   }
// }

// app/api/rfq/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RfqService, CustomerService } from '../../lib/mock-db/service';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError, ApiError } from '../../lib/error-handler';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/rfq/:id
 * Get a specific RFQ by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Get RFQ
    const rfq = RfqService.getById(id);

    // Check if RFQ exists
    if (!rfq) {
      throw new ApiError(`RFQ with ID ${id} not found`, 404);
    }

    // Get customer
    const customer = CustomerService.getById(rfq.customerId);

    // *** ADDED Mock Change History ***
    const mockChangeHistory = [
      { timestamp: new Date(Date.parse(rfq.createdAt) + 60000).toISOString(), user: 'System', action: `RFQ ${rfq.rfqNumber} created from ${rfq.source}` },
      { timestamp: new Date(Date.parse(rfq.createdAt) + 120000).toISOString(), user: 'System', action: 'SKUs automatically mapped' },
      { timestamp: new Date(Date.parse(rfq.updatedAt) - 60000).toISOString(), user: 'Jane Doe', action: `Status changed to ${rfq.status}` },
      // Add more mock history entries as needed
    ];
    // *** END Mock Change History ***

    // Combine RFQ and customer data
    const responseData = {
      ...rfq,
      customer,
      changeHistory: mockChangeHistory, // *** ADDED ***
      // You might also add original request data here if parsed
      originalRequestData: rfq.source === 'Email' ? {
        subject: `Re: RFQ Request for ${customer?.name}`,
        bodySnippet: 'Please provide pricing for the following items: ...',
        attachments: [{ name: 'rfq_details.xlsx', type: 'excel' }]
      } : null
    };

    // Return response
    return NextResponse.json(createSuccessResponse(responseData));
  } catch (error) {
    return handleApiError(error);
  }
}

// ... PATCH and DELETE methods remain the same ...

/**
 * PATCH /api/rfq/:id
 * Update a specific RFQ
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();

    // Check if RFQ exists
    const existingRfq = RfqService.getById(id);
    if (!existingRfq) {
      throw new ApiError(`RFQ with ID ${id} not found`, 404);
    }

    // Update RFQ
    const updatedRfq = RfqService.update(id, body);

    // Return response
    return NextResponse.json(createSuccessResponse(updatedRfq));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/rfq/:id
 * Delete an RFQ (not implemented in the mock service)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // In a real implementation, we would delete the RFQ
    // For the mock implementation, we'll just return a success message

    const { id } = params;

    // Check if RFQ exists
    const existingRfq = RfqService.getById(id);
    if (!existingRfq) {
      throw new ApiError(`RFQ with ID ${id} not found`, 404);
    }

    // Return success response
    return NextResponse.json(
      createSuccessResponse({ message: `RFQ ${id} deleted successfully` })
    );
  } catch (error) {
    return handleApiError(error);
  }
}