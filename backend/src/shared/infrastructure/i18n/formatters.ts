import type { FormattersInitializer } from 'typesafe-i18n';
import type { Locales } from './i18n-types.js';
import type { CustomFormatters } from './custom-formatters.js';

/**
 * Locale-specific formatters for typesafe-i18n
 *
 * These formatters can be used in translation strings with the pipe syntax:
 * - {count|number} - Format as localized number
 * - {value|currency} - Format as currency (BRL for pt-BR, USD for en-US, EUR for es)
 * - {date|dateShort} - Format as short date (e.g., 17/12/2025)
 * - {date|dateLong} - Format as long date (e.g., 17 de dezembro de 2025)
 * - {date|time} - Format as time (e.g., 14:30)
 * - {date|dateTime} - Format as date and time
 * - {date|relative} - Format as relative time (e.g., "2 hours ago")
 *
 * @example
 * ```typescript
 * // In translation file:
 * messages: {
 *   totalUsers: 'Total de usuários: {count|number}',
 *   price: 'Preço: {value|currency}',
 *   createdAt: 'Criado em {date|dateShort}',
 * }
 *
 * // Usage:
 * t.messages.totalUsers({ count: 1234567 }) // "Total de usuários: 1.234.567"
 * t.messages.price({ value: 99.99 }) // "Preço: R$ 99,99"
 * t.messages.createdAt({ date: new Date() }) // "Criado em 17/12/2025"
 * ```
 */

/**
 * Locale to Intl locale mapping
 */
const localeMap: Record<Locales, string> = {
  'pt-BR': 'pt-BR',
  'en-US': 'en-US',
  es: 'es-ES',
  de: 'de-DE',
  fr: 'fr-FR',
};

/**
 * Currency codes per locale
 */
const currencyMap: Record<Locales, string> = {
  'pt-BR': 'BRL',
  'en-US': 'USD',
  es: 'EUR',
  de: 'EUR',
  fr: 'EUR',
};

/**
 * Relative time labels per locale
 */
const relativeTimeLabels: Record<Locales, {
  now: string;
  seconds: string;
  minute: string;
  minutes: string;
  hour: string;
  hours: string;
  day: string;
  days: string;
  week: string;
  weeks: string;
  month: string;
  months: string;
  year: string;
  years: string;
}> = {
  'pt-BR': {
    now: 'agora mesmo',
    seconds: 'há alguns segundos',
    minute: 'há 1 minuto',
    minutes: 'há {0} minutos',
    hour: 'há 1 hora',
    hours: 'há {0} horas',
    day: 'há 1 dia',
    days: 'há {0} dias',
    week: 'há 1 semana',
    weeks: 'há {0} semanas',
    month: 'há 1 mês',
    months: 'há {0} meses',
    year: 'há 1 ano',
    years: 'há {0} anos',
  },
  'en-US': {
    now: 'just now',
    seconds: 'a few seconds ago',
    minute: '1 minute ago',
    minutes: '{0} minutes ago',
    hour: '1 hour ago',
    hours: '{0} hours ago',
    day: '1 day ago',
    days: '{0} days ago',
    week: '1 week ago',
    weeks: '{0} weeks ago',
    month: '1 month ago',
    months: '{0} months ago',
    year: '1 year ago',
    years: '{0} years ago',
  },
  es: {
    now: 'ahora mismo',
    seconds: 'hace unos segundos',
    minute: 'hace 1 minuto',
    minutes: 'hace {0} minutos',
    hour: 'hace 1 hora',
    hours: 'hace {0} horas',
    day: 'hace 1 día',
    days: 'hace {0} días',
    week: 'hace 1 semana',
    weeks: 'hace {0} semanas',
    month: 'hace 1 mes',
    months: 'hace {0} meses',
    year: 'hace 1 año',
    years: 'hace {0} años',
  },
  de: {
    now: 'gerade eben',
    seconds: 'vor einigen Sekunden',
    minute: 'vor 1 Minute',
    minutes: 'vor {0} Minuten',
    hour: 'vor 1 Stunde',
    hours: 'vor {0} Stunden',
    day: 'vor 1 Tag',
    days: 'vor {0} Tagen',
    week: 'vor 1 Woche',
    weeks: 'vor {0} Wochen',
    month: 'vor 1 Monat',
    months: 'vor {0} Monaten',
    year: 'vor 1 Jahr',
    years: 'vor {0} Jahren',
  },
  fr: {
    now: 'à l\'instant',
    seconds: 'il y a quelques secondes',
    minute: 'il y a 1 minute',
    minutes: 'il y a {0} minutes',
    hour: 'il y a 1 heure',
    hours: 'il y a {0} heures',
    day: 'il y a 1 jour',
    days: 'il y a {0} jours',
    week: 'il y a 1 semaine',
    weeks: 'il y a {0} semaines',
    month: 'il y a 1 mois',
    months: 'il y a {0} mois',
    year: 'il y a 1 an',
    years: 'il y a {0} ans',
  },
};

/**
 * Format relative time
 */
function formatRelativeTime(date: Date, locale: Locales): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  const labels = relativeTimeLabels[locale];

  if (diffSec < 5) return labels.now;
  if (diffSec < 60) return labels.seconds;
  if (diffMin === 1) return labels.minute;
  if (diffMin < 60) return labels.minutes.replace('{0}', String(diffMin));
  if (diffHour === 1) return labels.hour;
  if (diffHour < 24) return labels.hours.replace('{0}', String(diffHour));
  if (diffDay === 1) return labels.day;
  if (diffDay < 7) return labels.days.replace('{0}', String(diffDay));
  if (diffWeek === 1) return labels.week;
  if (diffWeek < 4) return labels.weeks.replace('{0}', String(diffWeek));
  if (diffMonth === 1) return labels.month;
  if (diffMonth < 12) return labels.months.replace('{0}', String(diffMonth));
  if (diffYear === 1) return labels.year;
  return labels.years.replace('{0}', String(diffYear));
}

// Use type assertion to bypass BaseFormatters constraint since our CustomFormatters
// is more specifically typed than what typesafe-i18n expects
export const initFormatters = ((locale: Locales) => {
  const intlLocale = localeMap[locale];
  const currency = currencyMap[locale];

  const formatters: CustomFormatters = {
    /**
     * Format number with locale-specific separators
     * @example 1234567.89 → "1.234.567,89" (pt-BR) or "1,234,567.89" (en-US)
     */
    number: (value: number) => {
      return new Intl.NumberFormat(intlLocale).format(value);
    },

    /**
     * Format number as currency
     * @example 99.99 → "R$ 99,99" (pt-BR) or "$99.99" (en-US)
     */
    currency: (value: number) => {
      return new Intl.NumberFormat(intlLocale, {
        style: 'currency',
        currency,
      }).format(value);
    },

    /**
     * Format percentage
     * @example 0.15 → "15%"
     */
    percent: (value: number) => {
      return new Intl.NumberFormat(intlLocale, {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
    },

    /**
     * Format date as short date
     * @example Date → "17/12/2025" (pt-BR) or "12/17/2025" (en-US)
     */
    dateShort: (value: Date | string | number) => {
      const date = value instanceof Date ? value : new Date(value);
      return new Intl.DateTimeFormat(intlLocale, {
        dateStyle: 'short',
      }).format(date);
    },

    /**
     * Format date as long date
     * @example Date → "17 de dezembro de 2025" (pt-BR)
     */
    dateLong: (value: Date | string | number) => {
      const date = value instanceof Date ? value : new Date(value);
      return new Intl.DateTimeFormat(intlLocale, {
        dateStyle: 'long',
      }).format(date);
    },

    /**
     * Format time
     * @example Date → "14:30" or "2:30 PM"
     */
    time: (value: Date | string | number) => {
      const date = value instanceof Date ? value : new Date(value);
      return new Intl.DateTimeFormat(intlLocale, {
        timeStyle: 'short',
      }).format(date);
    },

    /**
     * Format date and time
     * @example Date → "17/12/2025, 14:30"
     */
    dateTime: (value: Date | string | number) => {
      const date = value instanceof Date ? value : new Date(value);
      return new Intl.DateTimeFormat(intlLocale, {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(date);
    },

    /**
     * Format as relative time
     * @example Date → "há 2 horas" (pt-BR) or "2 hours ago" (en-US)
     */
    relative: (value: Date | string | number) => {
      const date = value instanceof Date ? value : new Date(value);
      return formatRelativeTime(date, locale);
    },

    /**
     * Format bytes as human readable size
     * @example 1536 → "1.5 KB"
     */
    bytes: (value: number) => {
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let unitIndex = 0;
      let size = value;

      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }

      return `${new Intl.NumberFormat(intlLocale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(size)} ${units[unitIndex]}`;
    },
  };

  return formatters;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) satisfies FormattersInitializer<Locales, any>;
