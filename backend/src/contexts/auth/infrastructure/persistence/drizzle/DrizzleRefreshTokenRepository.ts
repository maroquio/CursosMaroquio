import { eq, and, lt, isNull } from 'drizzle-orm';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import type { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository.ts';
import { RefreshToken } from '../../../domain/entities/RefreshToken.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import { refreshTokensTable } from './schema.ts';

/**
 * DrizzleRefreshTokenRepository
 * Implements IRefreshTokenRepository using Drizzle ORM with PostgreSQL
 */
export class DrizzleRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private dbProvider: IDatabaseProvider) {}

  private get db(): DrizzleDatabase {
    return this.dbProvider.getDb();
  }

  async save(token: RefreshToken): Promise<void> {
    await this.db
      .insert(refreshTokensTable)
      .values({
        id: token.token,
        userId: token.userId.toValue(),
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
        revokedAt: token.revokedAt,
        replacedByToken: token.replacedByToken,
        userAgent: token.userAgent,
        ipAddress: token.ipAddress,
      });
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const result = await this.db
      .select()
      .from(refreshTokensTable)
      .where(eq(refreshTokensTable.id, token));

    if (!result || result.length === 0) {
      return null;
    }

    const row = result[0]!;
    const tokenResult = RefreshToken.reconstruct({
      id: row.id,
      userId: row.userId,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      revokedAt: row.revokedAt,
      replacedByToken: row.replacedByToken,
      userAgent: row.userAgent,
      ipAddress: row.ipAddress,
    });

    if (tokenResult.isFailure) {
      return null;
    }

    return tokenResult.getValue();
  }

  async findActiveByUserId(userId: UserId): Promise<RefreshToken[]> {
    const now = new Date();
    const result = await this.db
      .select()
      .from(refreshTokensTable)
      .where(
        and(
          eq(refreshTokensTable.userId, userId.toValue()),
          isNull(refreshTokensTable.revokedAt)
        )
      );

    const tokens: RefreshToken[] = [];
    for (const row of result) {
      // Filter out expired tokens in memory
      if (row.expiresAt <= now) continue;

      const tokenResult = RefreshToken.reconstruct({
        id: row.id,
        userId: row.userId,
        expiresAt: row.expiresAt,
        createdAt: row.createdAt,
        revokedAt: row.revokedAt,
        replacedByToken: row.replacedByToken,
        userAgent: row.userAgent,
        ipAddress: row.ipAddress,
      });

      if (tokenResult.isOk) {
        tokens.push(tokenResult.getValue());
      }
    }

    return tokens;
  }

  async update(token: RefreshToken): Promise<void> {
    await this.db
      .update(refreshTokensTable)
      .set({
        revokedAt: token.revokedAt,
        replacedByToken: token.replacedByToken,
      })
      .where(eq(refreshTokensTable.id, token.token));
  }

  async revokeAllForUser(userId: UserId): Promise<void> {
    const now = new Date();
    await this.db
      .update(refreshTokensTable)
      .set({ revokedAt: now })
      .where(
        and(
          eq(refreshTokensTable.userId, userId.toValue()),
          isNull(refreshTokensTable.revokedAt)
        )
      );
  }

  async deleteExpired(): Promise<number> {
    const now = new Date();
    const result = await this.db
      .delete(refreshTokensTable)
      .where(lt(refreshTokensTable.expiresAt, now))
      .returning({ id: refreshTokensTable.id });

    return result.length;
  }
}
