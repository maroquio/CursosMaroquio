import { describe, test, expect } from 'vitest';
import { Password } from '@auth/domain/value-objects/Password.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

describe('Password Value Object', () => {
  // Typical bcrypt hash is 60 characters
  const validBcryptHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
  const shortHash = 'short_hash_12345';

  describe('create', () => {
    test('should create password from valid bcrypt hash', () => {
      const result = Password.create(validBcryptHash);

      expect(result.isOk).toBe(true);
      expect(result.getValue().getHash()).toBe(validBcryptHash);
    });

    test('should create password from any hash >= 20 characters', () => {
      const customHash = 'a'.repeat(20);
      const result = Password.create(customHash);

      expect(result.isOk).toBe(true);
    });
  });

  describe('validation errors', () => {
    test('should reject empty password hash', () => {
      const result = Password.create('');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PASSWORD_HASH_EMPTY);
    });

    test('should reject whitespace only', () => {
      const result = Password.create('   ');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PASSWORD_HASH_EMPTY);
    });

    test('should reject hash shorter than 20 characters', () => {
      const result = Password.create(shortHash);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.INVALID_PASSWORD_HASH);
    });

    test('should reject hash with 19 characters', () => {
      const result = Password.create('a'.repeat(19));

      expect(result.isFailure).toBe(true);
    });
  });

  describe('getHash', () => {
    test('should return the stored hash', () => {
      const password = Password.create(validBcryptHash).getValue();

      expect(password.getHash()).toBe(validBcryptHash);
    });
  });

  describe('equality', () => {
    test('should be equal for same hash', () => {
      const password1 = Password.create(validBcryptHash).getValue();
      const password2 = Password.create(validBcryptHash).getValue();

      expect(password1.equals(password2)).toBe(true);
    });

    test('should not be equal for different hashes', () => {
      const hash1 = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
      const hash2 = '$2a$10$DIFFERENT_HASH_VALUE_HERE1234567890abcdefgh';

      const password1 = Password.create(hash1).getValue();
      const password2 = Password.create(hash2).getValue();

      expect(password1.equals(password2)).toBe(false);
    });
  });

  describe('immutability', () => {
    test('should be immutable', () => {
      const password = Password.create(validBcryptHash).getValue();
      const props = password.getProps();

      // Attempting to modify props should not affect the original
      expect(() => {
        (props as any).hashedPassword = 'modified';
      }).toThrow(); // Object.freeze throws in strict mode
    });
  });
});
