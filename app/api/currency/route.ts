import { NextRequest, NextResponse } from 'next/server';
import { getExchangeRates } from '../lib/currency-utils';
import { createSuccessResponse } from '../lib/api-response';
import { handleApiError } from '../lib/error-handler';

/**
 * GET /api/currency/rates
 * Get current exchange rates
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
 * POST /api/currency/convert
 * Convert amounts between currencies
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.amount || !body.fromCurrency || !body.toCurrency) {
      return NextResponse.json(
        { success: false, error: 'Amount, fromCurrency, and toCurrency are required' },
        { status: 400 }
      );
    }
    
    const { amount, fromCurrency, toCurrency } = body;
    
    // Import the convertCurrency function to use for conversion
    const { convertCurrency } = await import('../lib/currency-utils');
    
    // Convert the amount
    const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency);
    
    // Return the converted amount
    return NextResponse.json(
      createSuccessResponse({
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount,
        targetCurrency: toCurrency
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}