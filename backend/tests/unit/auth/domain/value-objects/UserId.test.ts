import { describe, test, expect } from 'vitest';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

describe('UserId Value Object', () => {
  describe('create', () => {
    test('should create a new UserId with UUID v7', () => {
      const userId = UserId.create();

      expect(userId).toBeDefined();
      expect(userId.toValue()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    test('should create different IDs on each call', () => {
      const userId1 = UserId.create();
      const userId2 = UserId.create();

      expect(userId1.toValue()).not.toBe(userId2.toValue());
    });

    test('should create with provided UUID', () => {
      const providedId = '019364c6-8c2a-7d8e-8a3b-1c2d3e4f5a6b';
      const userId = UserId.create(providedId);

      expect(userId.toValue()).toBe(providedId);
    });
  });

  describe('createFromString', () => {
    test('should create UserId from valid UUID v7', () => {
      const validUuid = '019364c6-8c2a-7d8e-8a3b-1c2d3e4f5a6b';
      const result = UserId.createFromString(validUuid);

      expect(result.isOk).toBe(true);
      expect(result.getValue().toValue()).toBe(validUuid);
    });

    test('should accept lowercase UUID v7', () => {
      const result = UserId.createFromString('019364c6-8c2a-7d8e-8a3b-1c2d3e4f5a6b');

      expect(result.isOk).toBe(true);
    });

    test('should accept uppercase UUID v7', () => {
      const result = UserId.createFromString('019364C6-8C2A-7D8E-8A3B-1C2D3E4F5A6B');

      expect(result.isOk).toBe(true);
    });

    test('should reject UUID v4 (version 4)', () => {
      // UUID v4 has 4 in the version position
      const uuidV4 = '550e8400-e29b-41d4-a716-446655440000';
      const result = UserId.createFromString(uuidV4);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.INVALID_USER_ID);
    });

    test('should reject invalid format', () => {
      const result = UserId.createFromString('not-a-uuid');

      expect(result.isFailure).toBe(true);
    });

    test('should reject empty string', () => {
      const result = UserId.createFromString('');

      expect(result.isFailure).toBe(true);
    });

    test('should reject UUID without dashes', () => {
      const result = UserId.createFromString('019364c68c2a7d8e8a3b1c2d3e4f5a6b');

      expect(result.isFailure).toBe(true);
    });

    test('should reject UUID with wrong variant', () => {
      // Variant bits should be 10xx (8, 9, a, b), not c, d, e, f
      const wrongVariant = '019364c6-8c2a-7d8e-ca3b-1c2d3e4f5a6b';
      const result = UserId.createFromString(wrongVariant);

      expect(result.isFailure).toBe(true);
    });
  });

  describe('equality', () => {
    test('should be equal for same UUID', () => {
      const uuid = '019364c6-8c2a-7d8e-8a3b-1c2d3e4f5a6b';
      const userId1 = UserId.createFromString(uuid).getValue();
      const userId2 = UserId.createFromString(uuid).getValue();

      expect(userId1.equals(userId2)).toBe(true);
    });

    test('should not be equal for different UUIDs', () => {
      const userId1 = UserId.create();
      const userId2 = UserId.create();

      expect(userId1.equals(userId2)).toBe(false);
    });

    test('should not be equal to null/undefined', () => {
      const userId = UserId.create();

      expect(userId.equals(null as any)).toBe(false);
      expect(userId.equals(undefined)).toBe(false);
    });
  });

  describe('toValue', () => {
    test('should return the UUID string', () => {
      const uuid = '019364c6-8c2a-7d8e-8a3b-1c2d3e4f5a6b';
      const userId = UserId.createFromString(uuid).getValue();

      expect(userId.toValue()).toBe(uuid);
    });
  });

  describe('UUID v7 properties', () => {
    test('should generate time-ordered UUIDs', async () => {
      const userId1 = UserId.create();
      await new Promise((resolve) => setTimeout(resolve, 5));
      const userId2 = UserId.create();

      // UUID v7 are time-ordered, so lexicographically sortable
      expect(userId1.toValue() < userId2.toValue()).toBe(true);
    });
  });
});
