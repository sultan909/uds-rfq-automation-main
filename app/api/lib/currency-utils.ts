/**
 * Currency types supported by the application
 */
export type CurrencyCode = 'CAD' | 'USD';

/**
 * Exchange rates for currency conversion
 * In a real application, these would be updated from an external source
 */
const EXCHANGE_RATES = {
  CAD_TO_USD: 0.74,
  USD_TO_CAD: 1.35
};

/**
 * Convert an amount from one currency to another
 * @param amount The amount to convert
 * @param fromCurrency The source currency
 * @param toCurrency The target currency
 * @returns The converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): number {
  // If both currencies are the same, no conversion needed
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  // Perform the conversion
  if (fromCurrency === 'CAD' && toCurrency === 'USD') {
    return parseFloat((amount * EXCHANGE_RATES.CAD_TO_USD).toFixed(2));
  } else if (fromCurrency === 'USD' && toCurrency === 'CAD') {
    return parseFloat((amount * EXCHANGE_RATES.USD_TO_CAD).toFixed(2));
  }
  
  // Should not happen if the types are enforced
  throw new Error(`Unsupported currency conversion: ${fromCurrency} to ${toCurrency}`);
}

/**
 * Format a currency amount according to the specified currency
 * @param amount The amount to format
 * @param currency The currency code
 * @returns Formatted string with currency symbol
 */
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Get the current exchange rates
 * @returns Object containing exchange rates
 */
export function getExchangeRates() {
  return {
    CAD_TO_USD: EXCHANGE_RATES.CAD_TO_USD,
    USD_TO_CAD: EXCHANGE_RATES.USD_TO_CAD
  };
}