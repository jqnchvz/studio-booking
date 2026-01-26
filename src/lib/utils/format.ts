/**
 * Format amount in cents to Chilean Peso (CLP) string
 * @param amountInCents - Amount in cents (e.g., 999000 = $9.990 CLP)
 * @returns Formatted string (e.g., "$9.990")
 */
export function formatCLP(amountInCents: number): string {
  // Convert cents to pesos (divide by 100)
  const pesos = amountInCents / 100;

  // Format with thousand separators using Chilean format
  // Chilean format uses "." for thousands and no decimal places for CLP
  const formatted = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(pesos);

  return formatted;
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
