/**
 * CryptoUtils
 *
 * Utility functions for cryptographic operations.
 * Extracted to follow Single Responsibility Principle.
 *
 * Contains:
 * - Base64URL encoding/decoding (RFC 4648)
 * - Timing-safe comparisons
 * - HMAC operations
 */
export class CryptoUtils {
  /**
   * Base64URL encode a string
   * Uses RFC 4648 "URL and Filename safe" alphabet
   */
  static base64UrlEncode(str: string): string {
    const base64 = btoa(str);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Base64URL encode bytes
   * Uses RFC 4648 "URL and Filename safe" alphabet
   */
  static base64UrlEncodeBytes(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Base64URL decode to string
   * Handles missing padding automatically
   */
  static base64UrlDecode(str: string): string {
    // Add padding if needed
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4;
    if (padding) {
      base64 += '='.repeat(4 - padding);
    }
    return atob(base64);
  }

  /**
   * Base64URL decode to bytes
   */
  static base64UrlDecodeBytes(str: string): Uint8Array {
    const decoded = this.base64UrlDecode(str);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Timing-safe string comparison to prevent timing attacks
   *
   * Regular string comparison can leak information about
   * how many characters match before a mismatch is found.
   * This comparison always takes the same time regardless
   * of where the strings differ.
   */
  static timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  /**
   * Timing-safe bytes comparison
   */
  static timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i]! ^ b[i]!;
    }
    return result === 0;
  }

  /**
   * Create HMAC-SHA256 signature using Bun's native crypto
   */
  static hmacSha256(data: string, secret: Uint8Array): Uint8Array {
    const hmac = new Bun.CryptoHasher('sha256', secret);
    hmac.update(data);
    return new Uint8Array(hmac.digest());
  }

  /**
   * Generate cryptographically secure random bytes
   */
  static randomBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
  }

  /**
   * Generate a random hex string
   */
  static randomHex(length: number): string {
    const bytes = this.randomBytes(Math.ceil(length / 2));
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, length);
  }
}
