import { describe, it, expect } from 'bun:test';
import { BunPasswordHasher } from '@auth/infrastructure/services/BunPasswordHasher.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

/**
 * Tests for BunPasswordHasher
 * Uses Bun's native password API with Argon2id by default
 * Also tests backward compatibility with existing bcrypt hashes
 */
describe('BunPasswordHasher', () => {
  const hasher = new BunPasswordHasher();

  describe('hash', () => {
    it('should hash a password successfully', async () => {
      const password = 'securePassword123';

      const hash = await hasher.hash(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'samePassword123';

      const hash1 = await hasher.hash(password);
      const hash2 = await hasher.hash(password);

      // Argon2id generates unique salts, so hashes should differ
      expect(hash1).not.toBe(hash2);
    });

    it('should throw error for password shorter than 6 characters', async () => {
      const shortPassword = '12345';

      expect(hasher.hash(shortPassword)).rejects.toThrow(
        ErrorCode.PASSWORD_TOO_SHORT_FOR_HASH
      );
    });

    it('should throw error for empty password', async () => {
      expect(hasher.hash('')).rejects.toThrow(
        ErrorCode.PASSWORD_TOO_SHORT_FOR_HASH
      );
    });

    it('should handle exactly 6 character password', async () => {
      const password = '123456';

      const hash = await hasher.hash(password);

      expect(hash).toBeDefined();
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(100);

      const hash = await hasher.hash(longPassword);

      expect(hash).toBeDefined();
      const isValid = await hasher.compare(longPassword, hash);
      expect(isValid).toBe(true);
    });

    it('should handle special characters in password', async () => {
      const specialPassword = 'P@$$w0rd!#%&*()_+-=[]{}|;:,.<>?';

      const hash = await hasher.hash(specialPassword);
      const isValid = await hasher.compare(specialPassword, hash);

      expect(isValid).toBe(true);
    });

    it('should handle unicode characters in password', async () => {
      const unicodePassword = 'пароль密码パスワード';

      const hash = await hasher.hash(unicodePassword);
      const isValid = await hasher.compare(unicodePassword, hash);

      expect(isValid).toBe(true);
    });
  });

  describe('compare', () => {
    it('should return true for matching password', async () => {
      const password = 'correctPassword';
      const hash = await hasher.hash(password);

      const result = await hasher.compare(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'correctPassword';
      const hash = await hasher.hash(password);

      const result = await hasher.compare('wrongPassword', hash);

      expect(result).toBe(false);
    });

    it('should return false for similar but not exact password', async () => {
      const password = 'Password123';
      const hash = await hasher.hash(password);

      // Test case sensitivity
      expect(await hasher.compare('password123', hash)).toBe(false);
      expect(await hasher.compare('PASSWORD123', hash)).toBe(false);

      // Test trailing/leading spaces
      expect(await hasher.compare(' Password123', hash)).toBe(false);
      expect(await hasher.compare('Password123 ', hash)).toBe(false);
    });

    it('should handle empty password comparison', async () => {
      const password = 'validPassword';
      const hash = await hasher.hash(password);

      const result = await hasher.compare('', hash);

      expect(result).toBe(false);
    });
  });

  describe('backward compatibility with bcrypt', () => {
    it('should verify existing bcrypt hash', async () => {
      // Pre-generated bcrypt hash for 'testpassword' (cost 10)
      // This ensures existing users with bcrypt hashes can still log in
      const password = 'testpassword';
      const bcryptHash = '$2b$10$HAbfSju.P8p5/k1fBdes1.ihAXCa5Gmz4PgkMs020k9YqDEmzitQK';

      const result = await hasher.compare(password, bcryptHash);

      expect(result).toBe(true);
    });

    it('should reject wrong password against bcrypt hash', async () => {
      const bcryptHash = '$2b$10$HAbfSju.P8p5/k1fBdes1.ihAXCa5Gmz4PgkMs020k9YqDEmzitQK';

      const result = await hasher.compare('wrongpassword', bcryptHash);

      expect(result).toBe(false);
    });
  });

  describe('argon2id properties', () => {
    it('should produce hash with argon2id identifier', async () => {
      const hash = await hasher.hash('password123');

      // Argon2id hashes start with $argon2id$
      expect(hash).toMatch(/^\$argon2id\$/);
    });

    it('should take measurable time to hash (proof of work)', async () => {
      const start = performance.now();
      await hasher.hash('password123');
      const duration = performance.now() - start;

      // Argon2id should take at least a few milliseconds
      expect(duration).toBeGreaterThan(1);
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent hash operations', async () => {
      const passwords = Array.from({ length: 5 }, (_, i) => `password${i}`);

      const hashes = await Promise.all(passwords.map(p => hasher.hash(p)));

      expect(hashes).toHaveLength(5);
      // All hashes should be unique
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(5);
    });

    it('should handle concurrent compare operations', async () => {
      const password = 'sharedPassword';
      const hash = await hasher.hash(password);

      const results = await Promise.all(
        Array.from({ length: 10 }, () => hasher.compare(password, hash))
      );

      expect(results.every(r => r === true)).toBe(true);
    });
  });
});
