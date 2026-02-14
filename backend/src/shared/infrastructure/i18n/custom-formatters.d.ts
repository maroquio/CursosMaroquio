/**
 * Custom Formatters Type Definitions
 *
 * This file defines the custom formatters used in the i18n system.
 * The typesafe-i18n generator creates an empty Formatters type,
 * so we define our own CustomFormatters type to use directly.
 */

/**
 * Custom formatters interface
 * Defines all the formatting functions available in the i18n system
 */
export interface CustomFormatters {
  /** Format number with locale-specific separators */
  number: (value: number) => string;

  /** Format number as currency (BRL, USD, EUR based on locale) */
  currency: (value: number) => string;

  /** Format number as percentage */
  percent: (value: number) => string;

  /** Format date as short date (e.g., 17/12/2025) */
  dateShort: (value: Date | string | number) => string;

  /** Format date as long date (e.g., 17 de dezembro de 2025) */
  dateLong: (value: Date | string | number) => string;

  /** Format time (e.g., 14:30 or 2:30 PM) */
  time: (value: Date | string | number) => string;

  /** Format date and time together */
  dateTime: (value: Date | string | number) => string;

  /** Format as relative time (e.g., "2 hours ago") */
  relative: (value: Date | string | number) => string;

  /** Format bytes as human readable size (e.g., "1.5 KB") */
  bytes: (value: number) => string;
}
