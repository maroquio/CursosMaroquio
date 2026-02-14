/**
 * Centralized formatting utilities for the application.
 * These functions eliminate code duplication across components.
 */

/**
 * Formats a date string for display.
 * @param date - ISO date string
 * @param locale - Locale string (default: 'pt-BR')
 * @returns Formatted date string (e.g., "15 jan. 2024")
 */
export const formatDate = (date: string, locale = 'pt-BR'): string => {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

/**
 * Formats a date string with full month name.
 * @param date - ISO date string
 * @param locale - Locale string (default: 'pt-BR')
 * @returns Formatted date string (e.g., "15 de janeiro de 2024")
 */
export const formatDateLong = (date: string, locale = 'pt-BR'): string => {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
};

/**
 * Formats a price value for display.
 * @param price - Price in smallest currency unit
 * @param currency - Currency code (default: 'BRL')
 * @param freeLabel - Label to show when price is 0 (default: 'Gratuito')
 * @returns Formatted price string (e.g., "R$ 99,90" or "Gratuito")
 */
export const formatPrice = (
  price: number,
  currency = 'BRL',
  freeLabel = 'Gratuito'
): string => {
  if (price === 0) return freeLabel;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
  }).format(price);
};

/**
 * Formats a duration in minutes for display.
 * @param minutes - Duration in minutes
 * @returns Formatted duration string (e.g., "45min", "1h 30min") or null if no duration
 */
export const formatDuration = (minutes?: number): string | null => {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
};

/**
 * Formats a duration in minutes with alternative style.
 * Uses space between number and unit (e.g., "1h 30min")
 * @param minutes - Duration in minutes
 * @returns Formatted duration string or null if no duration
 */
export const formatDurationSpaced = (minutes?: number): string | null => {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins > 0 ? `${mins}min` : ''}`.trim();
  }
  return `${mins}min`;
};

/**
 * Formats seconds into a readable time string.
 * @param totalSeconds - Total seconds
 * @returns Formatted time string (e.g., "2h 30min")
 */
export const formatTimeFromSeconds = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
};

/**
 * Formats a number with thousand separators.
 * @param value - Number to format
 * @param locale - Locale string (default: 'pt-BR')
 * @returns Formatted number string (e.g., "1.234.567")
 */
export const formatNumber = (value: number, locale = 'pt-BR'): string => {
  return new Intl.NumberFormat(locale).format(value);
};

/**
 * Formats a percentage value.
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string (e.g., "85%")
 */
export const formatPercentage = (value: number, decimals = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Formats a Brazilian phone number.
 * @param value - Input value
 * @returns Formatted phone: (XX) XXXXX-XXXX
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 11);

  if (limited.length === 0) return '';
  if (limited.length <= 2) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  if (limited.length <= 10) return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
}

/**
 * Removes phone formatting, returning only digits.
 * @param value - Formatted value
 * @returns Digits only
 */
export function unformatPhone(value: string): string {
  return value.replace(/\D/g, '');
}
