import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { initFormatters } from '@shared/infrastructure/i18n/formatters';
import type { CustomFormatters } from '@shared/infrastructure/i18n';

describe('i18n Formatters', () => {
  describe('number formatter', () => {
    test('should format number in pt-BR (dot as thousands, comma as decimal)', () => {
      const formatters = initFormatters('pt-BR');
      expect(formatters.number(1234567.89)).toBe('1.234.567,89');
    });

    test('should format number in en-US (comma as thousands, dot as decimal)', () => {
      const formatters = initFormatters('en-US');
      expect(formatters.number(1234567.89)).toBe('1,234,567.89');
    });

    test('should format number in es (dot as thousands, comma as decimal)', () => {
      const formatters = initFormatters('es');
      // Spanish uses similar format to Portuguese
      expect(formatters.number(1234567.89)).toMatch(/1[\.\s]234[\.\s]567,89/);
    });
  });

  describe('currency formatter', () => {
    test('should format currency in pt-BR as BRL', () => {
      const formatters = initFormatters('pt-BR');
      const result = formatters.currency(99.99);
      expect(result).toContain('R$');
      expect(result).toContain('99,99');
    });

    test('should format currency in en-US as USD', () => {
      const formatters = initFormatters('en-US');
      const result = formatters.currency(99.99);
      expect(result).toContain('$');
      expect(result).toContain('99.99');
    });

    test('should format currency in es as EUR', () => {
      const formatters = initFormatters('es');
      const result = formatters.currency(99.99);
      // EUR symbol may vary
      expect(result).toMatch(/€|EUR/);
    });
  });

  describe('percent formatter', () => {
    test('should format percentage in pt-BR', () => {
      const formatters = initFormatters('pt-BR');
      expect(formatters.percent(0.15)).toBe('15%');
    });

    test('should format percentage with decimals', () => {
      const formatters = initFormatters('en-US');
      expect(formatters.percent(0.1567)).toBe('15.67%');
    });
  });

  describe('dateShort formatter', () => {
    test('should format date as short in pt-BR (dd/mm/yyyy)', () => {
      const formatters = initFormatters('pt-BR');
      const date = new Date(2025, 11, 17); // December 17, 2025
      expect(formatters.dateShort(date)).toBe('17/12/2025');
    });

    test('should format date as short in en-US (mm/dd/yyyy)', () => {
      const formatters = initFormatters('en-US');
      const date = new Date(2025, 11, 17);
      expect(formatters.dateShort(date)).toBe('12/17/25');
    });

    test('should accept string date', () => {
      const formatters = initFormatters('pt-BR');
      // Use explicit time to avoid timezone issues with date-only strings
      expect(formatters.dateShort('2025-12-17T12:00:00')).toBe('17/12/2025');
    });

    test('should accept timestamp', () => {
      const formatters = initFormatters('pt-BR');
      const timestamp = new Date(2025, 11, 17).getTime();
      expect(formatters.dateShort(timestamp)).toBe('17/12/2025');
    });
  });

  describe('dateLong formatter', () => {
    test('should format date as long in pt-BR', () => {
      const formatters = initFormatters('pt-BR');
      const date = new Date(2025, 11, 17);
      expect(formatters.dateLong(date)).toBe('17 de dezembro de 2025');
    });

    test('should format date as long in en-US', () => {
      const formatters = initFormatters('en-US');
      const date = new Date(2025, 11, 17);
      expect(formatters.dateLong(date)).toBe('December 17, 2025');
    });

    test('should format date as long in es', () => {
      const formatters = initFormatters('es');
      const date = new Date(2025, 11, 17);
      expect(formatters.dateLong(date)).toBe('17 de diciembre de 2025');
    });
  });

  describe('time formatter', () => {
    test('should format time in pt-BR (24h format)', () => {
      const formatters = initFormatters('pt-BR');
      const date = new Date(2025, 11, 17, 14, 30);
      expect(formatters.time(date)).toBe('14:30');
    });

    test('should format time in en-US (12h format with AM/PM)', () => {
      const formatters = initFormatters('en-US');
      const date = new Date(2025, 11, 17, 14, 30);
      expect(formatters.time(date)).toBe('2:30 PM');
    });
  });

  describe('dateTime formatter', () => {
    test('should format date and time together', () => {
      const formatters = initFormatters('pt-BR');
      const date = new Date(2025, 11, 17, 14, 30);
      const result = formatters.dateTime(date);
      expect(result).toContain('17/12/2025');
      expect(result).toContain('14:30');
    });
  });

  describe('relative formatter', () => {
    let mockNow: Date;

    beforeEach(() => {
      mockNow = new Date(2025, 11, 17, 14, 30, 0);
      vi.useFakeTimers();
      vi.setSystemTime(mockNow);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test('should show "agora mesmo" for very recent dates in pt-BR', () => {
      const formatters = initFormatters('pt-BR');
      const date = new Date(mockNow.getTime() - 2000); // 2 seconds ago
      expect(formatters.relative(date)).toBe('agora mesmo');
    });

    test('should show "just now" for very recent dates in en-US', () => {
      const formatters = initFormatters('en-US');
      const date = new Date(mockNow.getTime() - 2000);
      expect(formatters.relative(date)).toBe('just now');
    });

    test('should show minutes ago', () => {
      const formatters = initFormatters('pt-BR');
      const date = new Date(mockNow.getTime() - 5 * 60 * 1000); // 5 minutes ago
      expect(formatters.relative(date)).toBe('há 5 minutos');
    });

    test('should show hours ago', () => {
      const formatters = initFormatters('en-US');
      const date = new Date(mockNow.getTime() - 3 * 60 * 60 * 1000); // 3 hours ago
      expect(formatters.relative(date)).toBe('3 hours ago');
    });

    test('should show days ago', () => {
      const formatters = initFormatters('es');
      const date = new Date(mockNow.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      expect(formatters.relative(date)).toBe('hace 2 días');
    });

    test('should show singular forms correctly', () => {
      const formatters = initFormatters('pt-BR');
      const oneMinute = new Date(mockNow.getTime() - 1 * 60 * 1000);
      expect(formatters.relative(oneMinute)).toBe('há 1 minuto');

      const oneHour = new Date(mockNow.getTime() - 1 * 60 * 60 * 1000);
      expect(formatters.relative(oneHour)).toBe('há 1 hora');

      const oneDay = new Date(mockNow.getTime() - 1 * 24 * 60 * 60 * 1000);
      expect(formatters.relative(oneDay)).toBe('há 1 dia');
    });
  });

  describe('bytes formatter', () => {
    test('should format bytes', () => {
      const formatters = initFormatters('en-US');
      expect(formatters.bytes(500)).toBe('500 B');
    });

    test('should format kilobytes', () => {
      const formatters = initFormatters('en-US');
      expect(formatters.bytes(1536)).toBe('1.5 KB');
    });

    test('should format megabytes', () => {
      const formatters = initFormatters('en-US');
      expect(formatters.bytes(1048576)).toBe('1 MB');
    });

    test('should format gigabytes', () => {
      const formatters = initFormatters('pt-BR');
      const result = formatters.bytes(2.5 * 1024 * 1024 * 1024);
      expect(result).toContain('2,5');
      expect(result).toContain('GB');
    });
  });
});
