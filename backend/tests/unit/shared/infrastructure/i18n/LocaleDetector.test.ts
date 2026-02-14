import { describe, test, expect, beforeEach } from 'vitest';
import { LocaleDetector, SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@shared/infrastructure/i18n';

describe('LocaleDetector', () => {
  let detector: LocaleDetector;

  beforeEach(() => {
    detector = new LocaleDetector({
      supportedLocales: [...SUPPORTED_LOCALES],
      defaultLocale: DEFAULT_LOCALE,
      cookieName: 'locale',
    });
  });

  describe('Accept-Language header detection', () => {
    test('should detect pt-BR from Accept-Language header', () => {
      const request = new Request('http://localhost', {
        headers: { 'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8' },
      });

      expect(detector.detect(request)).toBe('pt-BR');
    });

    test('should detect en-US from Accept-Language header', () => {
      const request = new Request('http://localhost', {
        headers: { 'Accept-Language': 'en-US,en;q=0.9' },
      });

      expect(detector.detect(request)).toBe('en-US');
    });

    test('should detect es from Accept-Language header', () => {
      const request = new Request('http://localhost', {
        headers: { 'Accept-Language': 'es,en;q=0.9' },
      });

      expect(detector.detect(request)).toBe('es');
    });

    test('should match language-only (pt) to pt-BR', () => {
      const request = new Request('http://localhost', {
        headers: { 'Accept-Language': 'pt,en;q=0.9' },
      });

      expect(detector.detect(request)).toBe('pt-BR');
    });

    test('should match language-only (en) to en-US', () => {
      const request = new Request('http://localhost', {
        headers: { 'Accept-Language': 'en,de;q=0.9' },
      });

      expect(detector.detect(request)).toBe('en-US');
    });

    test('should respect quality values and choose highest priority', () => {
      const request = new Request('http://localhost', {
        headers: { 'Accept-Language': 'de;q=0.9,pt-BR;q=1.0,en-US;q=0.8' },
      });

      expect(detector.detect(request)).toBe('pt-BR');
    });

    test('should fallback to default for unsupported language', () => {
      const request = new Request('http://localhost', {
        // Japanese and Korean are not supported locales
        headers: { 'Accept-Language': 'ja-JP,ko-KR;q=0.9' },
      });

      expect(detector.detect(request)).toBe('pt-BR');
    });
  });

  describe('Cookie detection', () => {
    test('should detect locale from cookie', () => {
      const request = new Request('http://localhost', {
        headers: { Cookie: 'locale=en-US; other=value' },
      });

      expect(detector.detect(request)).toBe('en-US');
    });

    test('should ignore invalid locale in cookie', () => {
      const request = new Request('http://localhost', {
        headers: { Cookie: 'locale=invalid-locale' },
      });

      expect(detector.detect(request)).toBe('pt-BR');
    });

    test('should prefer Accept-Language over cookie when both present', () => {
      const request = new Request('http://localhost', {
        headers: {
          'Accept-Language': 'es',
          Cookie: 'locale=en-US',
        },
      });

      // Accept-Language takes priority
      expect(detector.detect(request)).toBe('es');
    });
  });

  describe('Default locale fallback', () => {
    test('should return default locale when no detection method works', () => {
      const request = new Request('http://localhost');

      expect(detector.detect(request)).toBe('pt-BR');
    });

    test('should return default locale for empty Accept-Language', () => {
      const request = new Request('http://localhost', {
        headers: { 'Accept-Language': '' },
      });

      expect(detector.detect(request)).toBe('pt-BR');
    });
  });

  describe('Custom configuration', () => {
    test('should use custom default locale', () => {
      const customDetector = new LocaleDetector({
        supportedLocales: ['pt-BR', 'en-US', 'es'],
        defaultLocale: 'en-US',
        cookieName: 'lang',
      });

      const request = new Request('http://localhost');
      expect(customDetector.detect(request)).toBe('en-US');
    });

    test('should use custom cookie name', () => {
      const customDetector = new LocaleDetector({
        supportedLocales: ['pt-BR', 'en-US', 'es'],
        defaultLocale: 'pt-BR',
        cookieName: 'my_locale',
      });

      const request = new Request('http://localhost', {
        headers: { Cookie: 'my_locale=es; locale=en-US' },
      });

      expect(customDetector.detect(request)).toBe('es');
    });
  });
});
