import { describe, it, expect } from 'vitest';
import { CryptoUtils } from '@shared/infrastructure/crypto/CryptoUtils.ts';

describe('CryptoUtils', () => {
  describe('base64UrlEncode', () => {
    it('should encode a simple string', () => {
      const result = CryptoUtils.base64UrlEncode('hello');

      expect(result).toBeDefined();
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    });

    it('should encode string with special characters', () => {
      // This string in base64 would normally contain +, /, or =
      const input = '>>>???';
      const result = CryptoUtils.base64UrlEncode(input);

      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    });

    it('should produce URL-safe output', () => {
      const result = CryptoUtils.base64UrlEncode('test data for encoding');

      // URL-safe means it can be used in URLs
      expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe('base64UrlEncodeBytes', () => {
    it('should encode Uint8Array', () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const result = CryptoUtils.base64UrlEncodeBytes(bytes);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should produce URL-safe output for bytes', () => {
      const bytes = new Uint8Array([255, 254, 253, 252]); // High-value bytes
      const result = CryptoUtils.base64UrlEncodeBytes(bytes);

      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    });

    it('should handle empty array', () => {
      const bytes = new Uint8Array([]);
      const result = CryptoUtils.base64UrlEncodeBytes(bytes);

      expect(result).toBe('');
    });
  });

  describe('base64UrlDecode', () => {
    it('should decode URL-safe base64', () => {
      const encoded = CryptoUtils.base64UrlEncode('hello world');
      const decoded = CryptoUtils.base64UrlDecode(encoded);

      expect(decoded).toBe('hello world');
    });

    it('should handle strings that need padding', () => {
      // Different lengths require different padding
      const test1 = CryptoUtils.base64UrlEncode('a');
      const test2 = CryptoUtils.base64UrlEncode('ab');
      const test3 = CryptoUtils.base64UrlEncode('abc');

      expect(CryptoUtils.base64UrlDecode(test1)).toBe('a');
      expect(CryptoUtils.base64UrlDecode(test2)).toBe('ab');
      expect(CryptoUtils.base64UrlDecode(test3)).toBe('abc');
    });

    it('should round-trip complex strings', () => {
      const original = '{"alg":"HS256","typ":"JWT"}';
      const encoded = CryptoUtils.base64UrlEncode(original);
      const decoded = CryptoUtils.base64UrlDecode(encoded);

      expect(decoded).toBe(original);
    });
  });

  describe('base64UrlDecodeBytes', () => {
    it('should decode to Uint8Array', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5]);
      const encoded = CryptoUtils.base64UrlEncodeBytes(original);
      const decoded = CryptoUtils.base64UrlDecodeBytes(encoded);

      expect(decoded).toEqual(original);
    });

    it('should handle high-value bytes', () => {
      const original = new Uint8Array([255, 128, 64, 0]);
      const encoded = CryptoUtils.base64UrlEncodeBytes(original);
      const decoded = CryptoUtils.base64UrlDecodeBytes(encoded);

      expect(decoded).toEqual(original);
    });
  });

  describe('timingSafeEqual', () => {
    it('should return true for equal strings', () => {
      const result = CryptoUtils.timingSafeEqual('secret', 'secret');

      expect(result).toBe(true);
    });

    it('should return false for different strings', () => {
      const result = CryptoUtils.timingSafeEqual('secret', 'Secret');

      expect(result).toBe(false);
    });

    it('should return false for strings of different lengths', () => {
      const result = CryptoUtils.timingSafeEqual('short', 'longer');

      expect(result).toBe(false);
    });

    it('should return true for empty strings', () => {
      const result = CryptoUtils.timingSafeEqual('', '');

      expect(result).toBe(true);
    });

    it('should return false when one char differs', () => {
      const result = CryptoUtils.timingSafeEqual('abcd', 'abce');

      expect(result).toBe(false);
    });
  });

  describe('timingSafeEqualBytes', () => {
    it('should return true for equal byte arrays', () => {
      const a = new Uint8Array([1, 2, 3, 4]);
      const b = new Uint8Array([1, 2, 3, 4]);

      const result = CryptoUtils.timingSafeEqualBytes(a, b);

      expect(result).toBe(true);
    });

    it('should return false for different byte arrays', () => {
      const a = new Uint8Array([1, 2, 3, 4]);
      const b = new Uint8Array([1, 2, 3, 5]);

      const result = CryptoUtils.timingSafeEqualBytes(a, b);

      expect(result).toBe(false);
    });

    it('should return false for arrays of different lengths', () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([1, 2, 3, 4]);

      const result = CryptoUtils.timingSafeEqualBytes(a, b);

      expect(result).toBe(false);
    });

    it('should return true for empty arrays', () => {
      const a = new Uint8Array([]);
      const b = new Uint8Array([]);

      const result = CryptoUtils.timingSafeEqualBytes(a, b);

      expect(result).toBe(true);
    });
  });

  describe('randomBytes', () => {
    it('should generate bytes of specified length', () => {
      const result = CryptoUtils.randomBytes(16);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(16);
    });

    it('should generate different bytes each time', () => {
      const result1 = CryptoUtils.randomBytes(32);
      const result2 = CryptoUtils.randomBytes(32);

      // Extremely unlikely to be equal for 32 random bytes
      expect(result1).not.toEqual(result2);
    });

    it('should handle zero length', () => {
      const result = CryptoUtils.randomBytes(0);

      expect(result.length).toBe(0);
    });

    it('should handle large length', () => {
      const result = CryptoUtils.randomBytes(1024);

      expect(result.length).toBe(1024);
    });
  });

  describe('randomHex', () => {
    it('should generate hex string of specified length', () => {
      const result = CryptoUtils.randomHex(32);

      expect(result.length).toBe(32);
      expect(result).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate different hex strings each time', () => {
      const result1 = CryptoUtils.randomHex(16);
      const result2 = CryptoUtils.randomHex(16);

      expect(result1).not.toBe(result2);
    });

    it('should handle odd length', () => {
      const result = CryptoUtils.randomHex(7);

      expect(result.length).toBe(7);
      expect(result).toMatch(/^[0-9a-f]+$/);
    });

    it('should handle zero length', () => {
      const result = CryptoUtils.randomHex(0);

      expect(result).toBe('');
    });
  });

  describe('base64UrlDecode edge cases', () => {
    it('should handle string that requires no padding (length % 4 === 0)', () => {
      // 'test' encodes to 'dGVzdA' (6 chars) in base64url, needs 2 padding
      // 'testab' encodes to 'dGVzdGFi' (8 chars) in base64url, needs 0 padding
      const original = 'testab';
      const encoded = CryptoUtils.base64UrlEncode(original);
      const decoded = CryptoUtils.base64UrlDecode(encoded);

      expect(decoded).toBe(original);
    });

    it('should handle string that requires 1 padding char', () => {
      // String that produces base64 with length % 4 === 3
      const original = 'hello';
      const encoded = CryptoUtils.base64UrlEncode(original);
      const decoded = CryptoUtils.base64UrlDecode(encoded);

      expect(decoded).toBe(original);
    });

    it('should handle string that requires 2 padding chars', () => {
      // String that produces base64 with length % 4 === 2
      const original = 'test';
      const encoded = CryptoUtils.base64UrlEncode(original);
      const decoded = CryptoUtils.base64UrlDecode(encoded);

      expect(decoded).toBe(original);
    });

    it('should handle empty string', () => {
      const encoded = CryptoUtils.base64UrlEncode('');
      const decoded = CryptoUtils.base64UrlDecode(encoded);

      expect(decoded).toBe('');
    });

    it('should correctly convert base64url chars back to standard base64', () => {
      // Test with input that would produce - and _ in base64url
      const input = '>>>???';
      const encoded = CryptoUtils.base64UrlEncode(input);
      const decoded = CryptoUtils.base64UrlDecode(encoded);

      expect(decoded).toBe(input);
    });
  });

  describe('base64UrlEncodeBytes edge cases', () => {
    it('should handle single byte', () => {
      const bytes = new Uint8Array([255]);
      const encoded = CryptoUtils.base64UrlEncodeBytes(bytes);
      const decoded = CryptoUtils.base64UrlDecodeBytes(encoded);

      expect(decoded).toEqual(bytes);
    });

    it('should handle bytes that produce + and / in standard base64', () => {
      // Bytes 62 and 63 produce + and / respectively in standard base64
      const bytes = new Uint8Array([251, 255, 191]); // Would produce base64 with + and /
      const encoded = CryptoUtils.base64UrlEncodeBytes(bytes);

      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain('/');
    });
  });

  describe('timingSafeEqual edge cases', () => {
    it('should return false immediately for different lengths', () => {
      // This is a fast-path return
      const result = CryptoUtils.timingSafeEqual('abc', 'abcd');
      expect(result).toBe(false);
    });

    it('should compare all characters even if first differs', () => {
      // The XOR loop should run for all characters
      const result = CryptoUtils.timingSafeEqual('xbcd', 'abcd');
      expect(result).toBe(false);
    });
  });
});
