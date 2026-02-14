import { describe, test, expect } from 'bun:test';
import { CryptoUtils } from '@shared/infrastructure/crypto/CryptoUtils.ts';

describe('CryptoUtils', () => {
  describe('base64UrlEncode', () => {
    test('should encode string to base64url', () => {
      const result = CryptoUtils.base64UrlEncode('Hello, World!');
      expect(result).toBe('SGVsbG8sIFdvcmxkIQ');
    });

    test('should not contain +, /, or = characters', () => {
      const result = CryptoUtils.base64UrlEncode('test?test+test/test');
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    });

    test('should encode JSON object', () => {
      const obj = { alg: 'HS256', typ: 'JWT' };
      const result = CryptoUtils.base64UrlEncode(JSON.stringify(obj));
      expect(result).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });
  });

  describe('base64UrlEncodeBytes', () => {
    test('should encode bytes to base64url', () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const result = CryptoUtils.base64UrlEncodeBytes(bytes);
      expect(result).toBe('SGVsbG8');
    });
  });

  describe('base64UrlDecode', () => {
    test('should decode base64url to string', () => {
      const result = CryptoUtils.base64UrlDecode('SGVsbG8sIFdvcmxkIQ');
      expect(result).toBe('Hello, World!');
    });

    test('should handle missing padding', () => {
      // Base64 without padding
      const result = CryptoUtils.base64UrlDecode('SGVsbG8');
      expect(result).toBe('Hello');
    });

    test('should decode JWT header', () => {
      const result = CryptoUtils.base64UrlDecode('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(JSON.parse(result)).toEqual({ alg: 'HS256', typ: 'JWT' });
    });
  });

  describe('base64UrlDecodeBytes', () => {
    test('should decode base64url to bytes', () => {
      const result = CryptoUtils.base64UrlDecodeBytes('SGVsbG8');
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]); // "Hello"
    });
  });

  describe('timingSafeEqual', () => {
    test('should return true for equal strings', () => {
      expect(CryptoUtils.timingSafeEqual('password123', 'password123')).toBe(true);
    });

    test('should return false for different strings', () => {
      expect(CryptoUtils.timingSafeEqual('password123', 'password124')).toBe(false);
    });

    test('should return false for different length strings', () => {
      expect(CryptoUtils.timingSafeEqual('short', 'longer')).toBe(false);
    });

    test('should return true for empty strings', () => {
      expect(CryptoUtils.timingSafeEqual('', '')).toBe(true);
    });
  });

  describe('timingSafeEqualBytes', () => {
    test('should return true for equal bytes', () => {
      const a = new Uint8Array([1, 2, 3, 4]);
      const b = new Uint8Array([1, 2, 3, 4]);
      expect(CryptoUtils.timingSafeEqualBytes(a, b)).toBe(true);
    });

    test('should return false for different bytes', () => {
      const a = new Uint8Array([1, 2, 3, 4]);
      const b = new Uint8Array([1, 2, 3, 5]);
      expect(CryptoUtils.timingSafeEqualBytes(a, b)).toBe(false);
    });

    test('should return false for different length arrays', () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([1, 2, 3, 4]);
      expect(CryptoUtils.timingSafeEqualBytes(a, b)).toBe(false);
    });
  });

  describe('hmacSha256', () => {
    test('should create consistent signatures', () => {
      const secret = new TextEncoder().encode('secret');
      const data = 'test data';

      const sig1 = CryptoUtils.hmacSha256(data, secret);
      const sig2 = CryptoUtils.hmacSha256(data, secret);

      expect(CryptoUtils.timingSafeEqualBytes(sig1, sig2)).toBe(true);
    });

    test('should create different signatures for different data', () => {
      const secret = new TextEncoder().encode('secret');

      const sig1 = CryptoUtils.hmacSha256('data1', secret);
      const sig2 = CryptoUtils.hmacSha256('data2', secret);

      expect(CryptoUtils.timingSafeEqualBytes(sig1, sig2)).toBe(false);
    });

    test('should create different signatures for different secrets', () => {
      const secret1 = new TextEncoder().encode('secret1');
      const secret2 = new TextEncoder().encode('secret2');
      const data = 'test data';

      const sig1 = CryptoUtils.hmacSha256(data, secret1);
      const sig2 = CryptoUtils.hmacSha256(data, secret2);

      expect(CryptoUtils.timingSafeEqualBytes(sig1, sig2)).toBe(false);
    });
  });

  describe('randomBytes', () => {
    test('should generate bytes of specified length', () => {
      const bytes = CryptoUtils.randomBytes(16);
      expect(bytes.length).toBe(16);
    });

    test('should generate different bytes each time', () => {
      const bytes1 = CryptoUtils.randomBytes(16);
      const bytes2 = CryptoUtils.randomBytes(16);
      expect(CryptoUtils.timingSafeEqualBytes(bytes1, bytes2)).toBe(false);
    });
  });

  describe('randomHex', () => {
    test('should generate hex string of specified length', () => {
      const hex = CryptoUtils.randomHex(32);
      expect(hex.length).toBe(32);
    });

    test('should only contain hex characters', () => {
      const hex = CryptoUtils.randomHex(64);
      expect(hex).toMatch(/^[0-9a-f]+$/);
    });

    test('should generate different hex each time', () => {
      const hex1 = CryptoUtils.randomHex(32);
      const hex2 = CryptoUtils.randomHex(32);
      expect(hex1).not.toBe(hex2);
    });
  });

  describe('roundtrip encoding', () => {
    test('should encode and decode string correctly', () => {
      const original = '{"userId":"123","email":"test@example.com"}';
      const encoded = CryptoUtils.base64UrlEncode(original);
      const decoded = CryptoUtils.base64UrlDecode(encoded);
      expect(decoded).toBe(original);
    });

    test('should encode and decode bytes correctly', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5, 255, 254, 253]);
      const encoded = CryptoUtils.base64UrlEncodeBytes(original);
      const decoded = CryptoUtils.base64UrlDecodeBytes(encoded);
      expect(Array.from(decoded)).toEqual(Array.from(original));
    });
  });
});
