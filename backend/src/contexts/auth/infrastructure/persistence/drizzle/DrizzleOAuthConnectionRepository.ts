import { eq, and, count } from 'drizzle-orm';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import { type IOAuthConnectionRepository } from '../../../domain/repositories/IOAuthConnectionRepository.ts';
import { OAuthConnection } from '../../../domain/entities/OAuthConnection.ts';
import { OAuthConnectionId } from '../../../domain/value-objects/OAuthConnectionId.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import { AuthProvider } from '../../../domain/value-objects/AuthProvider.ts';
import { oauthConnectionsTable } from './schema.ts';
import { OAuthConnectionMapper } from './OAuthConnectionMapper.ts';

/**
 * DrizzleOAuthConnectionRepository
 * Implements IOAuthConnectionRepository using Drizzle ORM with PostgreSQL
 * Handles all database operations for OAuth connections
 */
export class DrizzleOAuthConnectionRepository implements IOAuthConnectionRepository {
  constructor(private dbProvider: IDatabaseProvider) {}

  private get db(): DrizzleDatabase {
    return this.dbProvider.getDb();
  }

  /**
   * Save an OAuth connection (insert or update)
   */
  async save(connection: OAuthConnection): Promise<void> {
    const data = OAuthConnectionMapper.toPersistence(connection);

    // Check if connection already exists
    const existingConnection = await this.db
      .select()
      .from(oauthConnectionsTable)
      .where(eq(oauthConnectionsTable.id, connection.getId().toValue()));

    if (existingConnection && existingConnection.length > 0) {
      // Update existing connection
      await this.db
        .update(oauthConnectionsTable)
        .set(data)
        .where(eq(oauthConnectionsTable.id, connection.getId().toValue()));
    } else {
      // Insert new connection
      await this.db.insert(oauthConnectionsTable).values(data);
    }
  }

  /**
   * Find an OAuth connection by its ID
   */
  async findById(id: OAuthConnectionId): Promise<OAuthConnection | null> {
    const result = await this.db
      .select()
      .from(oauthConnectionsTable)
      .where(eq(oauthConnectionsTable.id, id.toValue()));

    if (!result || result.length === 0) {
      return null;
    }

    return OAuthConnectionMapper.toDomain(result[0]!).getValueOrThrow();
  }

  /**
   * Find an OAuth connection by provider and provider user ID
   * Used to check if a social account is already linked to any user
   */
  async findByProviderAndProviderUserId(
    provider: AuthProvider,
    providerUserId: string
  ): Promise<OAuthConnection | null> {
    const result = await this.db
      .select()
      .from(oauthConnectionsTable)
      .where(
        and(
          eq(oauthConnectionsTable.provider, provider.getValue()),
          eq(oauthConnectionsTable.providerUserId, providerUserId)
        )
      );

    if (!result || result.length === 0) {
      return null;
    }

    return OAuthConnectionMapper.toDomain(result[0]!).getValueOrThrow();
  }

  /**
   * Find an OAuth connection for a specific user and provider
   * Used to check if a user already has a specific provider linked
   */
  async findByUserIdAndProvider(userId: UserId, provider: AuthProvider): Promise<OAuthConnection | null> {
    const result = await this.db
      .select()
      .from(oauthConnectionsTable)
      .where(
        and(
          eq(oauthConnectionsTable.userId, userId.toValue()),
          eq(oauthConnectionsTable.provider, provider.getValue())
        )
      );

    if (!result || result.length === 0) {
      return null;
    }

    return OAuthConnectionMapper.toDomain(result[0]!).getValueOrThrow();
  }

  /**
   * Find all OAuth connections for a user
   * Used to list all linked providers for a user
   */
  async findAllByUserId(userId: UserId): Promise<OAuthConnection[]> {
    const results = await this.db
      .select()
      .from(oauthConnectionsTable)
      .where(eq(oauthConnectionsTable.userId, userId.toValue()));

    if (!results || results.length === 0) {
      return [];
    }

    return results.map((row) => OAuthConnectionMapper.toDomain(row).getValueOrThrow());
  }

  /**
   * Count OAuth connections for a user
   * Used to check if user has any OAuth connections
   */
  async countByUserId(userId: UserId): Promise<number> {
    const result = await this.db
      .select({ count: count() })
      .from(oauthConnectionsTable)
      .where(eq(oauthConnectionsTable.userId, userId.toValue()));

    return result[0]?.count ?? 0;
  }

  /**
   * Check if an OAuth connection exists by ID
   */
  async exists(id: OAuthConnectionId): Promise<boolean> {
    const result = await this.db
      .select()
      .from(oauthConnectionsTable)
      .where(eq(oauthConnectionsTable.id, id.toValue()));

    return result && result.length > 0;
  }

  /**
   * Delete an OAuth connection by its ID
   */
  async delete(id: OAuthConnectionId): Promise<void> {
    await this.db.delete(oauthConnectionsTable).where(eq(oauthConnectionsTable.id, id.toValue()));
  }

  /**
   * Delete an OAuth connection by user ID and provider
   * Convenience method for unlinking
   */
  async deleteByUserIdAndProvider(userId: UserId, provider: AuthProvider): Promise<void> {
    await this.db
      .delete(oauthConnectionsTable)
      .where(
        and(
          eq(oauthConnectionsTable.userId, userId.toValue()),
          eq(oauthConnectionsTable.provider, provider.getValue())
        )
      );
  }
}
