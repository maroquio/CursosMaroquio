import type { Locales } from './i18n-types.js';

/**
 * Supported locales in the application
 */
export const SUPPORTED_LOCALES: Locales[] = ['pt-BR', 'en-US', 'es', 'de', 'fr'];
export const DEFAULT_LOCALE: Locales = 'pt-BR';

/**
 * Configuration options for locale detection
 */
export interface LocaleDetectorOptions {
  supportedLocales: Locales[];
  defaultLocale: Locales;
  cookieName?: string;
}

/**
 * LocaleDetector
 *
 * Detects the user's preferred locale from HTTP requests using the following priority:
 * 1. Accept-Language header (RFC 7231)
 * 2. Cookie value
 * 3. Default locale (pt-BR)
 *
 * @example
 * ```typescript
 * const detector = new LocaleDetector();
 * const locale = detector.detect(request); // 'pt-BR' | 'en-US' | 'es'
 * ```
 */
export class LocaleDetector {
  private options: Required<LocaleDetectorOptions>;

  constructor(options?: Partial<LocaleDetectorOptions>) {
    this.options = {
      supportedLocales: options?.supportedLocales ?? SUPPORTED_LOCALES,
      defaultLocale: options?.defaultLocale ?? DEFAULT_LOCALE,
      cookieName: options?.cookieName ?? 'locale',
    };
  }

  /**
   * Detect locale from request with fallback chain:
   * 1. Accept-Language header
   * 2. Cookie (if present)
   * 3. Default locale
   */
  detect(request: Request): Locales {
    // Try Accept-Language header first
    const acceptLanguage = request.headers.get('Accept-Language');
    if (acceptLanguage) {
      const fromHeader = this.parseAcceptLanguage(acceptLanguage);
      if (fromHeader) return fromHeader;
    }

    // Try cookie
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
      const fromCookie = this.parseLocaleCookie(cookieHeader);
      if (fromCookie) return fromCookie;
    }

    // Default
    return this.options.defaultLocale;
  }

  /**
   * Parse Accept-Language header and return the best matching locale
   *
   * @example
   * // Accept-Language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7
   * parseAcceptLanguage(header) // returns 'pt-BR'
   */
  private parseAcceptLanguage(header: string): Locales | null {
    // Parse Accept-Language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7
    const languages = header
      .split(',')
      .map((lang) => {
        const [locale, qValue] = lang.trim().split(';q=');
        return {
          locale: locale?.trim() ?? '',
          quality: qValue ? parseFloat(qValue) : 1.0,
        };
      })
      .filter((item) => !isNaN(item.quality))
      .sort((a, b) => b.quality - a.quality);

    for (const { locale } of languages) {
      // Case-insensitive match (RFC 7231 - language tags are case-insensitive)
      const normalizedLocale = this.normalizeLocale(locale);
      if (normalizedLocale && this.options.supportedLocales.includes(normalizedLocale)) {
        return normalizedLocale;
      }

      // Language-only match (e.g., "pt" matches "pt-BR")
      const languageOnly = locale.split('-')[0]?.toLowerCase();
      if (languageOnly) {
        const match = this.options.supportedLocales.find((supported) => {
          const supportedLang = supported.split('-')[0]?.toLowerCase();
          return supportedLang === languageOnly;
        });
        if (match) return match;
      }
    }

    return null;
  }

  /**
   * Normalize locale string to match supported locales (case-insensitive)
   * Converts 'en-us' or 'EN-US' to 'en-US', 'pt-br' to 'pt-BR', etc.
   */
  private normalizeLocale(locale: string): Locales | null {
    const lower = locale.toLowerCase();
    for (const supported of this.options.supportedLocales) {
      if (supported.toLowerCase() === lower) {
        return supported;
      }
    }
    return null;
  }

  /**
   * Parse locale from cookie header
   */
  private parseLocaleCookie(cookieHeader: string): Locales | null {
    const cookies = cookieHeader.split(';').reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) acc[key] = value;
        return acc;
      },
      {} as Record<string, string>
    );

    const localeFromCookie = cookies[this.options.cookieName];
    if (localeFromCookie && this.options.supportedLocales.includes(localeFromCookie as Locales)) {
      return localeFromCookie as Locales;
    }

    return null;
  }

  /**
   * Get all supported locales
   */
  getSupportedLocales(): Locales[] {
    return [...this.options.supportedLocales];
  }

  /**
   * Get default locale
   */
  getDefaultLocale(): Locales {
    return this.options.defaultLocale;
  }

  /**
   * Check if a locale is supported
   */
  isSupported(locale: string): locale is Locales {
    return this.options.supportedLocales.includes(locale as Locales);
  }
}

/**
 * Singleton instance for convenience
 */
export const localeDetector = new LocaleDetector();
