import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'bun:test';
import { SQL } from 'bun';
import { drizzle } from 'drizzle-orm/bun-sql';
import { lt, eq } from 'drizzle-orm';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import { DrizzleRefreshTokenRepository } from '@auth/infrastructure/persistence/drizzle/DrizzleRefreshTokenRepository.ts';
import { RefreshToken } from '@auth/domain/entities/RefreshToken.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { usersTable, refreshTokensTable } from '@auth/infrastructure/persistence/drizzle/schema.ts';

/**
 * Integration tests for DrizzleRefreshTokenRepository
 * Uses PostgreSQL test database (app_test)
 */
describe('DrizzleRefreshTokenRepository Integration Tests', () => {
  let db: DrizzleDatabase;
  let sqlClient: SQL;
  let repository: DrizzleRefreshTokenRepository;

  const TEST_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://app:app@localhost:5435/app_test';

  // Test database provider
  class TestDatabaseProvider implements IDatabaseProvider {
    constructor(private database: DrizzleDatabase) {}
    getDb(): DrizzleDatabase {
      return this.database;
    }
  }

  // Helper to create a test user in the database
  const createTestUserInDb = async (userId: string): Promise<void> => {
    // Check if user exists first to avoid constraint violations
    const existing = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (existing.length === 0) {
      await db.insert(usersTable).values({
        id: userId,
        email: `${userId}@test.com`,
        password: 'hashedpassword',
        fullName: 'Test User',
        phone: '11999999999',
        createdAt: new Date(),
      });
    }
  };

  beforeAll(async () => {
    sqlClient = new SQL(TEST_DATABASE_URL);
    db = drizzle(sqlClient);

    // Verify connection
    await sqlClient.unsafe('SELECT 1');
  });

  afterAll(async () => {
    if (sqlClient) {
      await sqlClient.close();
    }
  });

  beforeEach(async () => {
    // Clear tables before each test (order matters for foreign keys)
    await db.delete(refreshTokensTable);
    await db.delete(usersTable);
    repository = new DrizzleRefreshTokenRepository(new TestDatabaseProvider(db));
  });

  // Helper to create a test refresh token
  const createTestToken = async (
    userId?: UserId,
    options?: {
      expiresInMs?: number;
      userAgent?: string;
      ipAddress?: string;
    }
  ): Promise<RefreshToken> => {
    const userIdToUse = userId || UserId.create();
    const expiresInMs = options?.expiresInMs ?? 7 * 24 * 60 * 60 * 1000; // 7 days

    // Ensure user exists in database
    await createTestUserInDb(userIdToUse.toValue());

    return RefreshToken.create({
      userId: userIdToUse,
      expiresInMs,
      userAgent: options?.userAgent,
      ipAddress: options?.ipAddress,
    });
  };

  describe('save', () => {
    it('should save a new refresh token to the database', async () => {
      const token = await createTestToken();

      await repository.save(token);

      const found = await repository.findByToken(token.token);
      expect(found).not.toBeNull();
      expect(found!.userId.toValue()).toBe(token.userId.toValue());
    });

    it('should save token with user agent and IP address', async () => {
      const token = await createTestToken(undefined, {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ipAddress: '192.168.1.100',
      });

      await repository.save(token);

      const found = await repository.findByToken(token.token);
      expect(found!.userAgent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      expect(found!.ipAddress).toBe('192.168.1.100');
    });

    it('should handle multiple tokens for same user', async () => {
      const userId = UserId.create();
      await createTestUserInDb(userId.toValue());

      const token1 = RefreshToken.create({
        userId,
        expiresInMs: 1000 * 60 * 60,
        userAgent: 'Chrome',
      });

      const token2 = RefreshToken.create({
        userId,
        expiresInMs: 1000 * 60 * 60,
        userAgent: 'Firefox',
      });

      await repository.save(token1);
      await repository.save(token2);

      const active = await repository.findActiveByUserId(userId);
      expect(active).toHaveLength(2);
    });
  });

  describe('findByToken', () => {
    it('should find an existing token', async () => {
      const token = await createTestToken();
      await repository.save(token);

      const found = await repository.findByToken(token.token);

      expect(found).not.toBeNull();
      expect(found!.token).toBe(token.token);
      expect(found!.userId.toValue()).toBe(token.userId.toValue());
    });

    it('should return null for non-existent token', async () => {
      const found = await repository.findByToken('non-existent-token');

      expect(found).toBeNull();
    });

    it('should reconstruct token with all properties', async () => {
      const token = await createTestToken(undefined, {
        userAgent: 'TestAgent',
        ipAddress: '10.0.0.1',
      });
      await repository.save(token);

      const found = await repository.findByToken(token.token);

      expect(found).not.toBeNull();
      expect(found!.userAgent).toBe('TestAgent');
      expect(found!.ipAddress).toBe('10.0.0.1');
      expect(found!.expiresAt).toBeInstanceOf(Date);
      expect(found!.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('findActiveByUserId', () => {
    it('should find active tokens for a user', async () => {
      const userId = UserId.create();
      await createTestUserInDb(userId.toValue());

      const token = RefreshToken.create({
        userId,
        expiresInMs: 1000 * 60 * 60, // 1 hour
      });

      await repository.save(token);

      const active = await repository.findActiveByUserId(userId);

      expect(active).toHaveLength(1);
      expect(active[0]!.token).toBe(token.token);
    });

    it('should not return revoked tokens', async () => {
      const userId = UserId.create();
      await createTestUserInDb(userId.toValue());

      const token = RefreshToken.create({
        userId,
        expiresInMs: 1000 * 60 * 60,
      });

      await repository.save(token);

      // Revoke the token
      token.revoke();
      await repository.update(token);

      const active = await repository.findActiveByUserId(userId);

      expect(active).toHaveLength(0);
    });

    it('should not return expired tokens', async () => {
      const userId = UserId.create();
      await createTestUserInDb(userId.toValue());

      // Create token that expires in 1ms (will be expired by the time we query)
      const token = RefreshToken.create({
        userId,
        expiresInMs: 1,
      });

      await repository.save(token);

      // Wait a bit to ensure token is expired
      await new Promise(resolve => setTimeout(resolve, 10));

      const active = await repository.findActiveByUserId(userId);

      expect(active).toHaveLength(0);
    });

    it('should return empty array for user with no tokens', async () => {
      const userId = UserId.create();
      await createTestUserInDb(userId.toValue());

      const active = await repository.findActiveByUserId(userId);

      expect(active).toHaveLength(0);
    });

    it('should return multiple active tokens', async () => {
      const userId = UserId.create();
      await createTestUserInDb(userId.toValue());

      const tokens = Array.from({ length: 3 }, () =>
        RefreshToken.create({
          userId,
          expiresInMs: 1000 * 60 * 60,
        })
      );

      for (const token of tokens) {
        await repository.save(token);
      }

      const active = await repository.findActiveByUserId(userId);

      expect(active).toHaveLength(3);
    });
  });

  describe('update', () => {
    it('should update revoked status', async () => {
      const token = await createTestToken();
      await repository.save(token);

      token.revoke();
      await repository.update(token);

      const found = await repository.findByToken(token.token);
      expect(found!.isRevoked()).toBe(true);
    });

    it('should update replaced_by_token', async () => {
      const token = await createTestToken();
      await repository.save(token);

      const newToken = await createTestToken(token.userId);
      token.revoke(newToken.token);
      await repository.update(token);

      const found = await repository.findByToken(token.token);
      expect(found!.replacedByToken).toBe(newToken.token);
    });
  });

  describe('revokeAllForUser', () => {
    it('should revoke all tokens for a user', async () => {
      const userId = UserId.create();
      await createTestUserInDb(userId.toValue());

      const tokens = Array.from({ length: 3 }, () =>
        RefreshToken.create({
          userId,
          expiresInMs: 1000 * 60 * 60,
        })
      );

      for (const token of tokens) {
        await repository.save(token);
      }

      await repository.revokeAllForUser(userId);

      const active = await repository.findActiveByUserId(userId);
      expect(active).toHaveLength(0);
    });

    it('should not affect other users tokens', async () => {
      const userId1 = UserId.create();
      const userId2 = UserId.create();
      await createTestUserInDb(userId1.toValue());
      await createTestUserInDb(userId2.toValue());

      const token1 = RefreshToken.create({
        userId: userId1,
        expiresInMs: 1000 * 60 * 60,
      });

      const token2 = RefreshToken.create({
        userId: userId2,
        expiresInMs: 1000 * 60 * 60,
      });

      await repository.save(token1);
      await repository.save(token2);

      await repository.revokeAllForUser(userId1);

      const active1 = await repository.findActiveByUserId(userId1);
      const active2 = await repository.findActiveByUserId(userId2);

      expect(active1).toHaveLength(0);
      expect(active2).toHaveLength(1);
    });
  });

  describe('deleteExpired', () => {
    it('should delete expired tokens', async () => {
      const userId = UserId.create();
      await createTestUserInDb(userId.toValue());

      // Create valid token IDs (must be at least 32 chars for RefreshTokenId validation)
      const expiredTokenId = 'expired_' + '0'.repeat(32);
      const validTokenId = 'valid___' + '1'.repeat(32);
      const pastTime = new Date(Date.now() - 60000); // 1 minute ago
      const futureTime = new Date(Date.now() + 3600000); // 1 hour from now
      const now = new Date();

      // Insert expired token
      await db.insert(refreshTokensTable).values({
        id: expiredTokenId,
        userId: userId.toValue(),
        expiresAt: pastTime,
        createdAt: now,
      });

      // Insert valid token
      await db.insert(refreshTokensTable).values({
        id: validTokenId,
        userId: userId.toValue(),
        expiresAt: futureTime,
        createdAt: now,
      });

      // Verify both tokens exist before deletion
      const beforeExpired = await repository.findByToken(expiredTokenId);
      const beforeValid = await repository.findByToken(validTokenId);
      expect(beforeExpired).not.toBeNull();
      expect(beforeValid).not.toBeNull();

      const deleted = await repository.deleteExpired();

      expect(deleted).toBe(1);

      // Verify only valid token remains
      const expiredFound = await repository.findByToken(expiredTokenId);
      const validFound = await repository.findByToken(validTokenId);

      expect(expiredFound).toBeNull();
      expect(validFound).not.toBeNull();
    });
  });

  describe('token rotation', () => {
    it('should properly handle token rotation flow', async () => {
      const userId = UserId.create();
      await createTestUserInDb(userId.toValue());

      // Create initial token
      const originalToken = RefreshToken.create({
        userId,
        expiresInMs: 1000 * 60 * 60,
      });

      await repository.save(originalToken);

      // Create new token (rotation)
      const newToken = RefreshToken.create({
        userId,
        expiresInMs: 1000 * 60 * 60,
      });

      // Revoke original with reference to new token
      originalToken.revoke(newToken.token);
      await repository.update(originalToken);
      await repository.save(newToken);

      // Verify original is revoked
      const foundOriginal = await repository.findByToken(originalToken.token);
      expect(foundOriginal).not.toBeNull();
      expect(foundOriginal!.isRevoked()).toBe(true);
      expect(foundOriginal!.replacedByToken).toBe(newToken.token);

      // Verify new token is active
      const active = await repository.findActiveByUserId(userId);
      expect(active).toHaveLength(1);
      expect(active[0]!.token).toBe(newToken.token);
    });
  });
});
