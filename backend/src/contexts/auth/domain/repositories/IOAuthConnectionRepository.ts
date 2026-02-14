import { type IRepository } from '@shared/infrastructure/persistence/IRepository.ts';
import { OAuthConnection } from '../entities/OAuthConnection.ts';
import { OAuthConnectionId } from '../value-objects/OAuthConnectionId.ts';
import { UserId } from '../value-objects/UserId.ts';
import { AuthProvider } from '../value-objects/AuthProvider.ts';

/**
 * OAuth Connection Repository Interface
 * Defines the contract for OAuth connection persistence operations
 * Domain layer does not know about implementation details (SQL, ORM, etc.)
 */
export interface IOAuthConnectionRepository extends IRepository<OAuthConnection, OAuthConnectionId> {
  /**
   * Find an OAuth connection by provider and provider user ID
   * Used to check if a social account is already linked to any user
   */
  findByProviderAndProviderUserId(provider: AuthProvider, providerUserId: string): Promise<OAuthConnection | null>;

  /**
   * Find an OAuth connection for a specific user and provider
   * Used to check if a user already has a specific provider linked
   */
  findByUserIdAndProvider(userId: UserId, provider: AuthProvider): Promise<OAuthConnection | null>;

  /**
   * Find all OAuth connections for a user
   * Used to list all linked providers for a user
   */
  findAllByUserId(userId: UserId): Promise<OAuthConnection[]>;

  /**
   * Count OAuth connections for a user
   * Used to check if user has any OAuth connections
   */
  countByUserId(userId: UserId): Promise<number>;

  /**
   * Delete an OAuth connection by user ID and provider
   * Convenience method for unlinking
   */
  deleteByUserIdAndProvider(userId: UserId, provider: AuthProvider): Promise<void>;
}
