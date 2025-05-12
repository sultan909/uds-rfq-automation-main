import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '../../lib/api-response';
import { handleApiError } from '../../lib/error-handler';

// In a real app, this would be stored in a database
const currencySettings = {
  defaultCurrency: 'CAD',
  availableCurrencies: ['CAD', 'USD'],
  exchangeRates: {
    CAD_TO_USD: 0.74,
    USD_TO_CAD: 1.35
  }
};

/**
 * GET /api/settings/currency
 * Get currency settings
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(createSuccessResponse(currencySettings));
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/settings/currency
 * Update currency settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Update only the fields provided in the request
    Object.assign(currencySettings, body);
    
    return NextResponse.json(createSuccessResponse(currencySettings));
  } catch (error) {
    return handleApiError(error);
  }
}