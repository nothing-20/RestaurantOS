let currentCurrency = 'USD';
let currentLocale = 'en-US';

/**
 * Updates the global currency configuration used by vanilla JS formatters.
 */
export function setGlobalCurrencyConfig(currency: string, locale: string) {
  currentCurrency = currency;
  currentLocale = locale;
}

/**
 * Formats a currency value (in main unit, e.g. dollars) using dynamic currency and locale settings.
 */
export function formatCurrency(value: number): string {
  try {
    return new Intl.NumberFormat(currentLocale, {
      style: 'currency',
      currency: currentCurrency
    }).format(value);
  } catch (e) {
    console.error('Failed to format currency using Intl:', e);
    return `${currentCurrency} ${value.toFixed(2)}`;
  }
}

/**
 * Formats a price in cents to a human-readable currency string.
 * @param priceInCents The price amount in cents (e.g. 1250 for $12.50)
 */
export function formatPrice(priceInCents: number, _currency?: string): string {
  return formatCurrency(priceInCents / 100);
}

/**
 * Formats an ISO string to a human-readable date and time.
 */
export function formatTimestamp(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculates the number of minutes elapsed since the given ISO timestamp.
 */
export function getElapsedMinutes(isoString: string): number {
  if (!isoString) return 0;
  const start = new Date(isoString).getTime();
  const now = Date.now();
  const diffMs = now - start;
  return Math.floor(diffMs / 60000);
}
