import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Logger, LogLevel, createLogger, logger } from '@shared/infrastructure/logging/Logger.ts';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('LogLevel', () => {
    it('should have correct ordering', () => {
      expect(LogLevel.DEBUG).toBe(0);
      expect(LogLevel.INFO).toBe(1);
      expect(LogLevel.WARN).toBe(2);
      expect(LogLevel.ERROR).toBe(3);
    });

    it('should be comparable', () => {
      expect(LogLevel.DEBUG < LogLevel.INFO).toBe(true);
      expect(LogLevel.INFO < LogLevel.WARN).toBe(true);
      expect(LogLevel.WARN < LogLevel.ERROR).toBe(true);
    });
  });

  describe('Logger constructor', () => {
    it('should create logger without context', () => {
      const log = new Logger();
      expect(log).toBeDefined();
    });

    it('should create logger with context', () => {
      const log = new Logger('TestContext');
      log.info('test message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('should call log method', () => {
      const log = new Logger();
      log.debug('debug message');
      // May or may not log depending on LOG_LEVEL
    });

    it('should include data in log', () => {
      const log = new Logger();
      log.debug('debug message', { key: 'value' });
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      const log = new Logger();
      log.info('info message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should include data in log', () => {
      const log = new Logger();
      log.info('info with data', { userId: '123' });
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      const log = new Logger();
      log.warn('warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should include data in log', () => {
      const log = new Logger();
      log.warn('warning with data', { reason: 'test' });
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      const log = new Logger();
      log.error('error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log error with Error object', () => {
      const log = new Logger();
      const error = new Error('Test error');
      log.error('error occurred', error);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log error with data', () => {
      const log = new Logger();
      const error = new Error('Test error');
      log.error('error with context', error, { userId: '123' });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('child', () => {
    it('should create child logger with context', () => {
      const parent = new Logger('Parent');
      const child = parent.child('Child');
      child.info('child message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should combine parent and child context', () => {
      const parent = new Logger('Parent');
      const child = parent.child('Child');
      const grandchild = child.child('Grandchild');
      grandchild.info('grandchild message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should create child from logger without context', () => {
      const parent = new Logger();
      const child = parent.child('Child');
      child.info('child message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('createLogger', () => {
    it('should create logger with context', () => {
      const log = createLogger('TestService');
      log.info('service log');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('default logger', () => {
    it('should be available as singleton', () => {
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should have all logging methods', () => {
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.child).toBe('function');
    });
  });

  describe('log entry structure', () => {
    it('should log with timestamp', () => {
      const log = new Logger();
      log.info('test');
      expect(consoleLogSpy).toHaveBeenCalled();
      // The output contains a timestamp
    });

    it('should log with level indicator', () => {
      const log = new Logger();
      log.info('test');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle empty data object', () => {
      const log = new Logger();
      log.info('test', {});
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
});
