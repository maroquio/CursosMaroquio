import type { UserId } from '../value-objects/UserId.ts';

/**
 * Token Payload
 * Data encoded in the JWT access token
 */
export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[]; // User roles for authorization
  iat: number; // Issued at
  exp: number; // Expiration
}

/**
 * Token Pair
 * Access token + Refresh token returned on login/refresh
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Access token expiry in seconds
}

/**
 * Token Service Interface
 * Domain service for JWT token operations
 */
export interface ITokenService {
  /**
   * Generate an access token for a user
   * @param userId - User identifier
   * @param email - User email
   * @param roles - User roles for authorization
   */
  generateAccessToken(userId: UserId, email: string, roles: string[]): string;

  /**
   * Verify and decode an access token
   * Returns null if token is invalid or expired
   */
  verifyAccessToken(token: string): TokenPayload | null;

  /**
   * Get access token expiry in milliseconds
   */
  getAccessTokenExpiryMs(): number;

  /**
   * Get refresh token expiry in milliseconds
   */
  getRefreshTokenExpiryMs(): number;
}
