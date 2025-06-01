import { NextRequest, NextResponse } from 'next/server';
import { getExchangeRates } from '../../lib/currency-utils';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';

/**
 * GET /api/currency/rates
 * Get current exchange rates
 * This endpoint is specifically for fetching exchange rates
 */
export async function GET(request: NextRequest) {
  try {
    const rates = getExchangeRates();
    
    return NextResponse.json(createSuccessResponse(rates));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/currency/rates
 * Update exchange rates (for manual override)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.USD_TO_CAD || typeof body.USD_TO_CAD !== 'number' || body.USD_TO_CAD <= 0) {
      return NextResponse.json(
        { success: false, error: 'USD_TO_CAD rate is required and must be a positive number' },
        { status: 400 }
      );
    }
    
    // In a real application, you would store this in a database
    // For now, we'll just return the updated rates
    const updatedRates = {
      USD_TO_CAD: body.USD_TO_CAD,
      CAD_TO_USD: parseFloat((1 / body.USD_TO_CAD).toFixed(4))
    };
    
    return NextResponse.json(createSuccessResponse(updatedRates));
  } catch (error) {
    return handleApiError(error);
  }
}
