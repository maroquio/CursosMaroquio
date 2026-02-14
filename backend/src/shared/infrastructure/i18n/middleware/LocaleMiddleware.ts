import { Elysia } from 'elysia';
import { LocaleDetector, DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../LocaleDetector.js';
import { loadLocaleAsync } from '../i18n-util.async.js';
import { i18n } from '../i18n-util.js';
import type { Locales, TranslationFunctions } from '../i18n-types.js';

/**
 * Locale context that will be available in all routes
 */
export interface LocaleContext {
  /** Current locale detected from request */
  locale: Locales;
  /** Translation functions for current locale */
  t: TranslationFunctions;
  /** Index signature for Elysia derive compatibility */
  [key: string]: unknown;
}

// Singleton detector instance
const detector = new LocaleDetector();

// Cache of loaded locales to avoid re-loading
const loadedLocales = new Set<Locales>();

/**
 * i18n Plugin for Elysia
 *
 * Adds locale detection and translation functions to all routes.
 * The plugin will:
 * 1. Detect locale from Accept-Language header or cookie
 * 2. Lazy-load the locale translations if not already loaded
 * 3. Add `locale` and `t` (translator) to the request context
 *
 * @example
 * ```typescript
 * // In main.ts
 * const app = new Elysia()
 *   .use(i18nPlugin)
 *   .get('/', ({ t }) => ({ message: t.http.welcome() }))
 * ```
 */
export const i18nPlugin = new Elysia({ name: 'i18n' }).derive(
  { as: 'global' },
  async ({ request }): Promise<LocaleContext> => {
    const locale = detector.detect(request);

    // Lazy load locale if not already loaded
    if (!loadedLocales.has(locale)) {
      await loadLocaleAsync(locale);
      loadedLocales.add(locale);
    }

    return {
      locale,
      t: i18n()[locale],
    };
  }
);

/**
 * Get translation function for a specific locale (for non-HTTP contexts)
 *
 * Useful when you need translations outside of request handlers,
 * such as in background jobs, CLI scripts, or tests.
 *
 * @example
 * ```typescript
 * const t = await getTranslator('en-US');
 * console.log(t.common.internalError()); // "An internal error occurred"
 * ```
 */
export async function getTranslator(locale: Locales = DEFAULT_LOCALE): Promise<TranslationFunctions> {
  if (!loadedLocales.has(locale)) {
    await loadLocaleAsync(locale);
    loadedLocales.add(locale);
  }
  return i18n()[locale];
}

/**
 * Synchronously get translator if locale is already loaded
 *
 * @throws Error if locale is not yet loaded
 */
export function getTranslatorSync(locale: Locales = DEFAULT_LOCALE): TranslationFunctions {
  if (!loadedLocales.has(locale)) {
    throw new Error(`Locale ${locale} not loaded. Use getTranslator() async version first.`);
  }
  return i18n()[locale];
}

/**
 * Pre-load all supported locales at application startup
 *
 * Call this in main.ts before starting the server to ensure
 * all locales are ready and avoid async loading during requests.
 *
 * @example
 * ```typescript
 * // In main.ts
 * await preloadAllLocales();
 * const app = new Elysia()...
 * ```
 */
export async function preloadAllLocales(): Promise<void> {
  for (const locale of SUPPORTED_LOCALES) {
    if (!loadedLocales.has(locale)) {
      await loadLocaleAsync(locale);
      loadedLocales.add(locale);
    }
  }
}

/**
 * Check if a locale is already loaded
 */
export function isLocaleLoaded(locale: Locales): boolean {
  return loadedLocales.has(locale);
}

/**
 * Get all currently loaded locales
 */
export function getLoadedLocales(): Locales[] {
  return Array.from(loadedLocales);
}

// Re-export types and constants for convenience
export { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../LocaleDetector.js';
export type { Locales, TranslationFunctions } from '../i18n-types.js';
