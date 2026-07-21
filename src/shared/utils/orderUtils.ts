/**
 * Shared utility for generating standardized Order IDs in RestaurantOS.
 * Expected format: ORD-YYYYMMDD-XXXXXX
 */
export const generateUniqueOrderId = (): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;
  const randStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${dateStr}-${randStr}`;
};
