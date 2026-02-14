import type { RefreshToken } from '../entities/RefreshToken.ts';
import type { UserId } from '../value-objects/UserId.ts';

/**
 * Refresh Token Repository Interface
 * Defines persistence operations for refresh tokens
 */
export interface IRefreshTokenRepository {
  /**
   * Save a new refresh token
   */
  save(token: RefreshToken): Promise<void>;

  /**
   * Find a refresh token by its value
   */
  findByToken(token: string): Promise<RefreshToken | null>;

  /**
   * Find all active tokens for a user
   */
  findActiveByUserId(userId: UserId): Promise<RefreshToken[]>;

  /**
   * Update a token (for revocation)
   */
  update(token: RefreshToken): Promise<void>;

  /**
   * Revoke all tokens for a user
   */
  revokeAllForUser(userId: UserId): Promise<void>;

  /**
   * Delete expired tokens (cleanup job)
   */
  deleteExpired(): Promise<number>;
}
