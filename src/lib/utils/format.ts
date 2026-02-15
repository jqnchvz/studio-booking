/**
 * Formats a CLP amount as Chilean Peso currency.
 * @param amount - Amount in CLP (e.g., 9990 = $9.990 CLP)
 * @returns Formatted currency string (e.g., "$9.990")
 */
export function formatCLP(amount: number): string {
  // Chilean Peso (CLP) is a zero-decimal currency
  // Format with thousand separators using Chilean format
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to Chilean timezone string
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatChileanDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Format date with time to Chilean timezone string
 * @param date - Date to format
 * @returns Formatted datetime string
 */
export function formatChileanDateTime(date: Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format time to Chilean timezone string (HH:MM AM/PM format)
 * Ensures consistent formatting across server and client to prevent hydration errors
 * @param date - Date to format
 * @returns Formatted time string
 */
export function formatChileanTime(date: Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
