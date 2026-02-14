import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { drizzle } from 'drizzle-orm/bun-sql';
import { SQL } from 'bun';
import { DrizzleOAuthConnectionRepository } from '@auth/infrastructure/persistence/drizzle/DrizzleOAuthConnectionRepository.ts';
import { DrizzleUserRepository } from '@auth/infrastructure/persistence/drizzle/DrizzleUserRepository.ts';
import { DrizzleRoleRepository } from '@auth/infrastructure/persistence/drizzle/DrizzleRoleRepository.ts';
import { OAuthConnection } from '@auth/domain/entities/OAuthConnection.ts';
import { OAuthConnectionId } from '@auth/domain/value-objects/OAuthConnectionId.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { AuthProvider } from '@auth/domain/value-objects/AuthProvider.ts';
import { OAuthProfile } from '@auth/domain/value-objects/OAuthProfile.ts';
import { User } from '@auth/domain/entities/User.ts';
import { Email } from '@auth/domain/value-objects/Email.ts';
import { Password } from '@auth/domain/value-objects/Password.ts';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import {
  usersTable,
  rolesTable,
  userRolesTable,
  oauthConnectionsTable,
} from '@auth/infrastructure/persistence/drizzle/schema.ts';

// Test database URL
const TEST_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://app:app@localhost:5435/app';

// Test database provider
class TestDatabaseProvider implements IDatabaseProvider {
  constructor(private db: DrizzleDatabase) {}
  getDb(): DrizzleDatabase {
    return this.db;
  }
}

describe('DrizzleOAuthConnectionRepository Integration Tests', () => {
  let sqlClient: SQL;
  let db: DrizzleDatabase;
  let provider: IDatabaseProvider;
  let repository: DrizzleOAuthConnectionRepository;
  let userRepository: DrizzleUserRepository;
  let roleRepository: DrizzleRoleRepository;
  let testUser: User;
  let testUserId: UserId;

  beforeAll(async () => {
    sqlClient = new SQL(TEST_DATABASE_URL);
    db = drizzle(sqlClient);
    provider = new TestDatabaseProvider(db);
    roleRepository = new DrizzleRoleRepository(provider);
    userRepository = new DrizzleUserRepository(provider, roleRepository);
    repository = new DrizzleOAuthConnectionRepository(provider);
  });

  afterAll(async () => {
    await sqlClient.close();
  });

  beforeEach(async () => {
    // Clear tables in correct order
    await db.delete(oauthConnectionsTable);
    await db.delete(userRolesTable);
    await db.delete(usersTable);

    // Create a test user
    const email = Email.create(`test-${Date.now()}@example.com`).getValue();
    const password = Password.create('$argon2id$v=19$m=65536,t=3,p=4$mockhashvalue').getValue();
    testUser = User.create(email, password, 'Test User', '11999999999').getValue();
    testUserId = testUser.getId();
    await userRepository.save(testUser);
  });

  describe('save()', () => {
    it('should insert a new OAuth connection', async () => {
      const profile = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: 'google-123',
        email: 'test@gmail.com',
        name: 'Test User',
      }).getValue();

      const connection = OAuthConnection.create({
        userId: testUserId,
        profile,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenExpiresAt: new Date(Date.now() + 3600000),
      }).getValue();

      await repository.save(connection);

      const found = await repository.findById(connection.getId());
      expect(found).not.toBeNull();
      expect(found!.getId().equals(connection.getId())).toBe(true);
      expect(found!.getProvider().isGoogle()).toBe(true);
      expect(found!.getProviderUserId()).toBe('google-123');
    });

    it('should update an existing OAuth connection', async () => {
      const profile = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: 'google-456',
        email: 'test@gmail.com',
      }).getValue();

      const connection = OAuthConnection.create({
        userId: testUserId,
        profile,
        accessToken: 'old-token',
      }).getValue();

      // Insert
      await repository.save(connection);

      // Update tokens
      connection.updateTokens('new-access-token', 'new-refresh-token', new Date(Date.now() + 7200000));
      await repository.save(connection);

      const found = await repository.findById(connection.getId());
      expect(found).not.toBeNull();
      expect(found!.getAccessToken()).toBe('new-access-token');
      expect(found!.getRefreshToken()).toBe('new-refresh-token');
    });
  });

  describe('findById()', () => {
    it('should return null for non-existent connection', async () => {
      const nonExistentId = OAuthConnectionId.create();
      const found = await repository.findById(nonExistentId);
      expect(found).toBeNull();
    });

    it('should find an existing connection by ID', async () => {
      const profile = OAuthProfile.create({
        provider: AuthProvider.FACEBOOK,
        providerUserId: 'fb-789',
        email: 'test@facebook.com',
        name: 'FB User',
        avatarUrl: 'https://example.com/avatar.jpg',
      }).getValue();

      const connection = OAuthConnection.create({
        userId: testUserId,
        profile,
      }).getValue();

      await repository.save(connection);

      const found = await repository.findById(connection.getId());
      expect(found).not.toBeNull();
      expect(found!.getEmail()).toBe('test@facebook.com');
      expect(found!.getName()).toBe('FB User');
      expect(found!.getAvatarUrl()).toBe('https://example.com/avatar.jpg');
    });
  });

  describe('findByProviderAndProviderUserId()', () => {
    it('should find connection by provider and provider user ID', async () => {
      const profile = OAuthProfile.create({
        provider: AuthProvider.APPLE,
        providerUserId: 'apple-unique-id',
        email: 'test@privaterelay.appleid.com',
      }).getValue();

      const connection = OAuthConnection.create({
        userId: testUserId,
        profile,
      }).getValue();

      await repository.save(connection);

      const found = await repository.findByProviderAndProviderUserId(
        AuthProvider.APPLE,
        'apple-unique-id'
      );
      expect(found).not.toBeNull();
      expect(found!.getProvider().isApple()).toBe(true);
    });

    it('should return null when provider user ID does not exist', async () => {
      const found = await repository.findByProviderAndProviderUserId(
        AuthProvider.GOOGLE,
        'non-existent-id'
      );
      expect(found).toBeNull();
    });
  });

  describe('findByUserIdAndProvider()', () => {
    it('should find connection by user ID and provider', async () => {
      const profile = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: 'google-user-123',
      }).getValue();

      const connection = OAuthConnection.create({
        userId: testUserId,
        profile,
      }).getValue();

      await repository.save(connection);

      const found = await repository.findByUserIdAndProvider(testUserId, AuthProvider.GOOGLE);
      expect(found).not.toBeNull();
      expect(found!.getUserId().equals(testUserId)).toBe(true);
    });

    it('should return null when user has no connection for that provider', async () => {
      const found = await repository.findByUserIdAndProvider(testUserId, AuthProvider.FACEBOOK);
      expect(found).toBeNull();
    });
  });

  describe('findAllByUserId()', () => {
    it('should return all connections for a user', async () => {
      // Create multiple connections
      const googleProfile = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: 'google-multi-1',
      }).getValue();

      const facebookProfile = OAuthProfile.create({
        provider: AuthProvider.FACEBOOK,
        providerUserId: 'fb-multi-1',
      }).getValue();

      const googleConnection = OAuthConnection.create({
        userId: testUserId,
        profile: googleProfile,
      }).getValue();

      const facebookConnection = OAuthConnection.create({
        userId: testUserId,
        profile: facebookProfile,
      }).getValue();

      await repository.save(googleConnection);
      await repository.save(facebookConnection);

      const connections = await repository.findAllByUserId(testUserId);
      expect(connections.length).toBe(2);
    });

    it('should return empty array for user with no connections', async () => {
      const connections = await repository.findAllByUserId(testUserId);
      expect(connections).toEqual([]);
    });
  });

  describe('countByUserId()', () => {
    it('should return 0 for user with no connections', async () => {
      const count = await repository.countByUserId(testUserId);
      expect(count).toBe(0);
    });

    it('should return correct count for user with connections', async () => {
      const profile1 = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: 'count-google-1',
      }).getValue();

      const profile2 = OAuthProfile.create({
        provider: AuthProvider.FACEBOOK,
        providerUserId: 'count-fb-1',
      }).getValue();

      await repository.save(OAuthConnection.create({ userId: testUserId, profile: profile1 }).getValue());
      await repository.save(OAuthConnection.create({ userId: testUserId, profile: profile2 }).getValue());

      const count = await repository.countByUserId(testUserId);
      expect(count).toBe(2);
    });
  });

  describe('exists()', () => {
    it('should return false for non-existent connection', async () => {
      const nonExistentId = OAuthConnectionId.create();
      const exists = await repository.exists(nonExistentId);
      expect(exists).toBe(false);
    });

    it('should return true for existing connection', async () => {
      const profile = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: 'exists-test',
      }).getValue();

      const connection = OAuthConnection.create({
        userId: testUserId,
        profile,
      }).getValue();

      await repository.save(connection);

      const exists = await repository.exists(connection.getId());
      expect(exists).toBe(true);
    });
  });

  describe('delete()', () => {
    it('should delete an existing connection by ID', async () => {
      const profile = OAuthProfile.create({
        provider: AuthProvider.GOOGLE,
        providerUserId: 'delete-test',
      }).getValue();

      const connection = OAuthConnection.create({
        userId: testUserId,
        profile,
      }).getValue();

      await repository.save(connection);
      expect(await repository.exists(connection.getId())).toBe(true);

      await repository.delete(connection.getId());
      expect(await repository.exists(connection.getId())).toBe(false);
    });

    it('should not throw when deleting non-existent connection', async () => {
      const nonExistentId = OAuthConnectionId.create();
      await expect(repository.delete(nonExistentId)).resolves.toBeUndefined();
    });
  });

  describe('deleteByUserIdAndProvider()', () => {
    it('should delete connection by user ID and provider', async () => {
      const profile = OAuthProfile.create({
        provider: AuthProvider.FACEBOOK,
        providerUserId: 'delete-by-provider-test',
      }).getValue();

      const connection = OAuthConnection.create({
        userId: testUserId,
        profile,
      }).getValue();

      await repository.save(connection);
      expect(await repository.findByUserIdAndProvider(testUserId, AuthProvider.FACEBOOK)).not.toBeNull();

      await repository.deleteByUserIdAndProvider(testUserId, AuthProvider.FACEBOOK);
      expect(await repository.findByUserIdAndProvider(testUserId, AuthProvider.FACEBOOK)).toBeNull();
    });

    it('should not throw when no matching connection exists', async () => {
      await expect(
        repository.deleteByUserIdAndProvider(testUserId, AuthProvider.APPLE)
      ).resolves.toBeUndefined();
    });
  });
});
