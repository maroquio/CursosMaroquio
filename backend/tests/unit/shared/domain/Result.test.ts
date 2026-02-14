import { describe, test, expect } from 'vitest';
import { Result } from '@shared/domain/Result.ts';

describe('Result', () => {
  describe('ok', () => {
    test('should create a successful result with value', () => {
      const result = Result.ok('test value');

      expect(result.isOk).toBe(true);
      expect(result.isFailure).toBe(false);
      expect(result.getValue()).toBe('test value');
    });

    test('should work with different types', () => {
      const numberResult = Result.ok(42);
      const objectResult = Result.ok({ name: 'test' });

      expect(numberResult.getValue()).toBe(42);
      expect(objectResult.getValue()).toEqual({ name: 'test' });
    });
  });

  describe('fail', () => {
    test('should create a failed result with string error', () => {
      const result = Result.fail<string>('error message');

      expect(result.isOk).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe('error message');
    });

    test('should create a failed result with Error object', () => {
      const error = new Error('test error');
      const result = Result.fail<string>(error);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(error);
    });
  });

  describe('getValue', () => {
    test('should return value on success', () => {
      const result = Result.ok({ id: 1, name: 'test' });

      expect(result.getValue()).toEqual({ id: 1, name: 'test' });
    });

    test('should throw on failure', () => {
      const result = Result.fail<string>('error');

      expect(() => result.getValue()).toThrow('Cannot get value from failed result');
    });
  });

  describe('getValueOrThrow', () => {
    test('should return value on success', () => {
      const result = Result.ok('value');

      expect(result.getValueOrThrow()).toBe('value');
    });

    test('should throw error on failure with string', () => {
      const result = Result.fail<string>('error message');

      expect(() => result.getValueOrThrow()).toThrow('error message');
    });

    test('should throw original error on failure with Error', () => {
      const originalError = new Error('original error');
      const result = Result.fail<string>(originalError);

      expect(() => result.getValueOrThrow()).toThrow('original error');
    });
  });

  describe('getValueOrDefault', () => {
    test('should return value on success', () => {
      const result = Result.ok('actual value');

      expect(result.getValueOrDefault('default')).toBe('actual value');
    });

    test('should return default on failure', () => {
      const result = Result.fail<string>('error');

      expect(result.getValueOrDefault('default')).toBe('default');
    });
  });

  describe('map', () => {
    test('should transform value on success', () => {
      const result = Result.ok(5);
      const mapped = result.map((x) => x * 2);

      expect(mapped.isOk).toBe(true);
      expect(mapped.getValue()).toBe(10);
    });

    test('should pass through failure', () => {
      const result = Result.fail<number>('error');
      const mapped = result.map((x) => x * 2);

      expect(mapped.isFailure).toBe(true);
      expect(mapped.getError()).toBe('error');
    });

    test('should catch errors in map function', () => {
      const result = Result.ok(5);
      const mapped = result.map(() => {
        throw new Error('map error');
      });

      expect(mapped.isFailure).toBe(true);
    });
  });

  describe('flatMap', () => {
    test('should chain successful results', () => {
      const result = Result.ok(5);
      const chained = result.flatMap((x) => Result.ok(x * 2));

      expect(chained.isOk).toBe(true);
      expect(chained.getValue()).toBe(10);
    });

    test('should stop at first failure', () => {
      const result = Result.ok(5);
      const chained = result.flatMap(() => Result.fail<number>('chain error'));

      expect(chained.isFailure).toBe(true);
      expect(chained.getError()).toBe('chain error');
    });

    test('should pass through initial failure', () => {
      const result = Result.fail<number>('initial error');
      const chained = result.flatMap((x) => Result.ok(x * 2));

      expect(chained.isFailure).toBe(true);
      expect(chained.getError()).toBe('initial error');
    });
  });

  describe('real-world scenarios', () => {
    test('should work for validation chain', () => {
      const validateEmail = (email: string): Result<string> => {
        if (!email.includes('@')) {
          return Result.fail('Invalid email');
        }
        return Result.ok(email.toLowerCase());
      };

      const validateLength = (email: string): Result<string> => {
        if (email.length > 254) {
          return Result.fail('Email too long');
        }
        return Result.ok(email);
      };

      const validResult = validateEmail('Test@Example.com').flatMap(validateLength);
      expect(validResult.isOk).toBe(true);
      expect(validResult.getValue()).toBe('test@example.com');

      const invalidResult = validateEmail('invalid').flatMap(validateLength);
      expect(invalidResult.isFailure).toBe(true);
    });
  });
});
