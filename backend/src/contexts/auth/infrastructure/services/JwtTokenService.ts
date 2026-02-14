import { env } from '@shared/config/env.ts';
import { CryptoUtils } from '@shared/infrastructure/crypto/CryptoUtils.ts';
import type { ITokenService, TokenPayload } from '../../domain/services/ITokenService.ts';
import type { UserId } from '../../domain/value-objects/UserId.ts';

/**
 * JWT Token Service Implementation
 * Uses native Bun/Web Crypto APIs for JWT signing and verification
 *
 * Implements HS256 (HMAC-SHA256) algorithm.
 * Crypto utilities extracted to CryptoUtils for reusability.
 */
export class JwtTokenService implements ITokenService {
  private readonly secret: Uint8Array;
  private readonly accessExpiryMs: number;
  private readonly refreshExpiryMs: number;

  constructor() {
    // Convert secret to Uint8Array for crypto operations
    this.secret = new TextEncoder().encode(env.JWT_SECRET);
    this.accessExpiryMs = env.JWT_ACCESS_EXPIRY_MS;
    this.refreshExpiryMs = env.JWT_REFRESH_EXPIRY_MS;
  }

  /**
   * Generate an access token for a user
   * @param userId - User identifier
   * @param email - User email
   * @param roles - User roles for authorization
   */
  generateAccessToken(userId: UserId, email: string, roles: string[]): string {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + Math.floor(this.accessExpiryMs / 1000);

    const payload: TokenPayload = {
      userId: userId.toValue(),
      email,
      roles,
      iat: now,
      exp,
    };

    return this.sign(payload);
  }

  /**
   * Verify and decode an access token
   */
  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const payload = this.verify(token);
      if (!payload) return null;

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      const typedPayload = payload as TokenPayload;
      if (typedPayload.exp && typedPayload.exp < now) {
        return null;
      }

      return typedPayload;
    } catch {
      return null;
    }
  }

  getAccessTokenExpiryMs(): number {
    return this.accessExpiryMs;
  }

  getRefreshTokenExpiryMs(): number {
    return this.refreshExpiryMs;
  }

  /**
   * Sign a JWT payload using HS256
   */
  private sign(payload: object): string {
    const header = { alg: 'HS256', typ: 'JWT' };

    const encodedHeader = CryptoUtils.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = CryptoUtils.base64UrlEncode(JSON.stringify(payload));

    const signatureData = `${encodedHeader}.${encodedPayload}`;
    const signatureBytes = CryptoUtils.hmacSha256(signatureData, this.secret);
    const signature = CryptoUtils.base64UrlEncodeBytes(signatureBytes);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify a JWT and return its payload
   */
  private verify(token: string): object | null {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const encodedHeader = parts[0]!;
    const encodedPayload = parts[1]!;
    const signature = parts[2]!;

    // Verify signature
    const signatureData = `${encodedHeader}.${encodedPayload}`;
    const expectedSignatureBytes = CryptoUtils.hmacSha256(signatureData, this.secret);
    const expectedSignature = CryptoUtils.base64UrlEncodeBytes(expectedSignatureBytes);

    if (!CryptoUtils.timingSafeEqual(signature, expectedSignature)) {
      return null;
    }

    // Decode payload
    try {
      const payload = JSON.parse(CryptoUtils.base64UrlDecode(encodedPayload));
      return payload;
    } catch {
      return null;
    }
  }
}
