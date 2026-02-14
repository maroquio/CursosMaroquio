/**
 * Internationalization (i18n) Module
 *
 * This module provides type-safe internationalization support using typesafe-i18n.
 * It includes locale detection, translation functions, and formatting utilities.
 *
 * @example
 * ```typescript
 * // In main.ts - add i18n plugin
 * import { i18nPlugin, preloadAllLocales } from '@shared/infrastructure/i18n';
 *
 * await preloadAllLocales();
 * const app = new Elysia()
 *   .use(i18nPlugin)
 *   .get('/', ({ t }) => ({ message: t.http.welcome() }));
 *
 * // In handlers - use translations
 * const message = t.auth.user.registeredSuccess();
 * const error = t.auth.password.tooShort({ minLength: 8 });
 * ```
 *
 * @module i18n
 */

// Types
export type {
  Locales,
  Translation,
  TranslationFunctions,
  BaseLocale,
} from './i18n-types.js';

// Custom formatters type (extends the auto-generated empty Formatters)
export type { CustomFormatters } from './custom-formatters.js';

// Locale detection
export {
  LocaleDetector,
  localeDetector,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  type LocaleDetectorOptions,
} from './LocaleDetector.js';

// Middleware and Plugin
export {
  i18nPlugin,
  getTranslator,
  getTranslatorSync,
  preloadAllLocales,
  isLocaleLoaded,
  getLoadedLocales,
  type LocaleContext,
} from './middleware/LocaleMiddleware.js';

// Core i18n utilities (from typesafe-i18n generator)
export { i18n, i18nObject, i18nString } from './i18n-util.js';
export { loadLocaleAsync, loadAllLocalesAsync } from './i18n-util.async.js';
