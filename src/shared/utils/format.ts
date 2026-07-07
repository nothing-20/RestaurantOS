/**
 * Formats a price in cents to a human-readable currency string.
 * @param priceInCents The price amount in cents (e.g. 1250 for $12.50)
 * @param currency The currency symbol or code (defaults to USD)
 */
export function formatPrice(priceInCents: number, currency: string = '$'): string {
  const dollars = priceInCents / 100;
  return `${currency}${dollars.toFixed(2)}`;
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
