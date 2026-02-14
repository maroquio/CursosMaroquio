import { describe, test, expect } from 'vitest';
import pt_BR from '@shared/infrastructure/i18n/pt-BR/index';
import en_US from '@shared/infrastructure/i18n/en-US/index';
import es from '@shared/infrastructure/i18n/es/index';

/**
 * Extract all keys from nested object as dot-notation paths
 */
function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return getAllKeys(value as Record<string, unknown>, path);
    }
    return [path];
  });
}

/**
 * Get value from nested object by dot-notation path
 */
function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

describe('Translation Consistency', () => {
  const baseKeys = getAllKeys(pt_BR);
  const enKeys = getAllKeys(en_US);
  const esKeys = getAllKeys(es);

  describe('Structure consistency', () => {
    test('en-US should have same keys as pt-BR (base locale)', () => {
      const missingInEn = baseKeys.filter((key) => !enKeys.includes(key));
      const extraInEn = enKeys.filter((key) => !baseKeys.includes(key));

      expect(missingInEn).toEqual([]);
      expect(extraInEn).toEqual([]);
    });

    test('es should have same keys as pt-BR (base locale)', () => {
      const missingInEs = baseKeys.filter((key) => !esKeys.includes(key));
      const extraInEs = esKeys.filter((key) => !baseKeys.includes(key));

      expect(missingInEs).toEqual([]);
      expect(extraInEs).toEqual([]);
    });
  });

  describe('Value type consistency', () => {
    test.each(baseKeys)('key "%s" should have same type in all locales', (key) => {
      const ptValue = getByPath(pt_BR, key);
      const enValue = getByPath(en_US, key);
      const esValue = getByPath(es, key);

      expect(typeof enValue).toBe(typeof ptValue);
      expect(typeof esValue).toBe(typeof ptValue);
    });
  });

  describe('No empty translations', () => {
    test('pt-BR should have no empty strings', () => {
      const emptyKeys = baseKeys.filter((key) => {
        const value = getByPath(pt_BR, key);
        return typeof value === 'string' && value.trim() === '';
      });
      expect(emptyKeys).toEqual([]);
    });

    test('en-US should have no empty strings', () => {
      const emptyKeys = enKeys.filter((key) => {
        const value = getByPath(en_US, key);
        return typeof value === 'string' && value.trim() === '';
      });
      expect(emptyKeys).toEqual([]);
    });

    test('es should have no empty strings', () => {
      const emptyKeys = esKeys.filter((key) => {
        const value = getByPath(es, key);
        return typeof value === 'string' && value.trim() === '';
      });
      expect(emptyKeys).toEqual([]);
    });
  });

  describe('Parameter placeholder consistency', () => {
    /**
     * Extract placeholders like {name}, {minLength}, etc from string
     */
    function extractPlaceholders(str: string): string[] {
      const matches = str.match(/\{(\w+)\}/g) || [];
      return matches.map((m) => m.slice(1, -1)).sort();
    }

    test.each(baseKeys)('key "%s" should have same placeholders in all locales', (key) => {
      const ptValue = getByPath(pt_BR, key);
      const enValue = getByPath(en_US, key);
      const esValue = getByPath(es, key);

      if (typeof ptValue === 'string') {
        const ptPlaceholders = extractPlaceholders(ptValue);
        const enPlaceholders = extractPlaceholders(enValue as string);
        const esPlaceholders = extractPlaceholders(esValue as string);

        expect(enPlaceholders).toEqual(ptPlaceholders);
        expect(esPlaceholders).toEqual(ptPlaceholders);
      }
    });
  });

  describe('Required key sections exist', () => {
    const requiredSections = [
      'common',
      'auth',
      'auth.email',
      'auth.password',
      'auth.user',
      'auth.token',
      'auth.role',
      'auth.permission',
      'auth.oauth',
      'id',
      'http',
      'middleware',
      'validation',
      'dateTime',
    ];

    test.each(requiredSections)('section "%s" should exist in pt-BR', (section) => {
      const value = getByPath(pt_BR, section);
      expect(value).toBeDefined();
      expect(typeof value).toBe('object');
    });

    test.each(requiredSections)('section "%s" should exist in en-US', (section) => {
      const value = getByPath(en_US, section);
      expect(value).toBeDefined();
      expect(typeof value).toBe('object');
    });

    test.each(requiredSections)('section "%s" should exist in es', (section) => {
      const value = getByPath(es, section);
      expect(value).toBeDefined();
      expect(typeof value).toBe('object');
    });
  });

  describe('Specific translation content', () => {
    test('common.internalError is translated correctly', () => {
      expect(pt_BR.common.internalError).toBe('Ocorreu um erro interno');
      expect(en_US.common.internalError).toBe('An internal error occurred');
      expect(es.common.internalError).toBe('Ocurrió un error interno');
    });

    test('password validation messages have correct placeholders', () => {
      expect(pt_BR.auth.password.tooShort).toContain('{minLength}');
      expect(en_US.auth.password.tooShort).toContain('{minLength}');
      expect(es.auth.password.tooShort).toContain('{minLength}');

      expect(pt_BR.auth.password.tooLong).toContain('{maxLength}');
      expect(en_US.auth.password.tooLong).toContain('{maxLength}');
      expect(es.auth.password.tooLong).toContain('{maxLength}');
    });

    test('role messages have correct placeholders', () => {
      expect(pt_BR.auth.role.alreadyExists).toContain('{name}');
      expect(en_US.auth.role.alreadyExists).toContain('{name}');
      expect(es.auth.role.alreadyExists).toContain('{name}');
    });
  });
});
