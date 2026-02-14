import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'bun:test';
import { SQL } from 'bun';
import { drizzle } from 'drizzle-orm/bun-sql';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import { DrizzleUserRepository } from '@auth/infrastructure/persistence/drizzle/DrizzleUserRepository.ts';
import { DrizzleRoleRepository } from '@auth/infrastructure/persistence/drizzle/DrizzleRoleRepository.ts';
import { User } from '@auth/domain/entities/User.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { Email } from '@auth/domain/value-objects/Email.ts';
import { Password } from '@auth/domain/value-objects/Password.ts';
import { usersTable, refreshTokensTable, userRolesTable, rolesTable } from '@auth/infrastructure/persistence/drizzle/schema.ts';

/**
 * Integration tests for DrizzleUserRepository
 * Uses PostgreSQL test database (app_test)
 */
describe('DrizzleUserRepository Integration Tests', () => {
  let db: DrizzleDatabase;
  let sqlClient: SQL;
  let repository: DrizzleUserRepository;
  let roleRepository: DrizzleRoleRepository;

  const TEST_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://app:app@localhost:5435/app_test';

  // Test database provider
  class TestDatabaseProvider implements IDatabaseProvider {
    constructor(private database: DrizzleDatabase) {}
    getDb(): DrizzleDatabase {
      return this.database;
    }
  }

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
    // Clear tables before each test (order matters due to FK constraints)
    await db.delete(userRolesTable);
    await db.delete(refreshTokensTable);
    await db.delete(usersTable);

    // Create repositories with provider
    const provider = new TestDatabaseProvider(db);
    roleRepository = new DrizzleRoleRepository(provider);
    repository = new DrizzleUserRepository(provider, roleRepository);
  });

  // Helper to create a test user
  const createTestUser = (emailStr = 'test@example.com'): User => {
    const email = Email.create(emailStr).getValue();
    const password = Password.create('$2a$10$hashedpassword1234567890abcdefghij').getValue();
    return User.create(email, password, 'Test User', '11999999999').getValue();
  };

  // Helper to create user with specific ID
  const createTestUserWithId = (id: UserId, emailStr: string, passwordHash: string): User => {
    const email = Email.create(emailStr).getValue();
    const password = Password.create(passwordHash).getValue();
    return User.reconstruct(id, email, password, 'Test User', '11999999999', true, new Date());
  };

  describe('save', () => {
    it('should save a new user to the database', async () => {
      const user = createTestUser();

      await repository.save(user);

      // Verify user was saved
      const found = await repository.findById(user.getId());
      expect(found).not.toBeNull();
      expect(found!.getEmail().getValue()).toBe('test@example.com');
    });

    it('should update an existing user', async () => {
      const userId = UserId.create();
      const user = createTestUserWithId(userId, 'test@example.com', '$2a$10$hashedpassword1234567890abcdefghij');
      await repository.save(user);

      // Create updated user with same ID but different email
      const updatedUser = createTestUserWithId(userId, 'updated@example.com', '$2a$10$newhashedpassword890abcdefghijklm');

      await repository.save(updatedUser);

      // Verify user was updated
      const found = await repository.findById(userId);
      expect(found!.getEmail().getValue()).toBe('updated@example.com');
    });

    it('should handle multiple users', async () => {
      const user1 = createTestUser('user1@example.com');
      const user2 = createTestUser('user2@example.com');

      await repository.save(user1);
      await repository.save(user2);

      const exists1 = await repository.exists(user1.getId());
      const exists2 = await repository.exists(user2.getId());
      expect(exists1).toBe(true);
      expect(exists2).toBe(true);
    });
  });

  describe('findById', () => {
    it('should find an existing user by ID', async () => {
      const user = createTestUser();
      await repository.save(user);

      const found = await repository.findById(user.getId());

      expect(found).not.toBeNull();
      expect(found!.getId().toValue()).toBe(user.getId().toValue());
      expect(found!.getEmail().getValue()).toBe('test@example.com');
    });

    it('should return null for non-existent user', async () => {
      const nonExistentId = UserId.create();

      const found = await repository.findById(nonExistentId);

      expect(found).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find an existing user by email', async () => {
      const user = createTestUser('findme@example.com');
      await repository.save(user);

      const email = Email.create('findme@example.com').getValue();
      const found = await repository.findByEmail(email);

      expect(found).not.toBeNull();
      expect(found!.getEmail().getValue()).toBe('findme@example.com');
    });

    it('should return null for non-existent email', async () => {
      const email = Email.create('notfound@example.com').getValue();

      const found = await repository.findByEmail(email);

      expect(found).toBeNull();
    });
  });

  describe('existsByEmail', () => {
    it('should return true for existing email', async () => {
      const user = createTestUser('exists@example.com');
      await repository.save(user);

      const email = Email.create('exists@example.com').getValue();
      const exists = await repository.existsByEmail(email);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent email', async () => {
      const email = Email.create('notexists@example.com').getValue();

      const exists = await repository.existsByEmail(email);

      expect(exists).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true for existing user ID', async () => {
      const user = createTestUser();
      await repository.save(user);

      const exists = await repository.exists(user.getId());

      expect(exists).toBe(true);
    });

    it('should return false for non-existent user ID', async () => {
      const nonExistentId = UserId.create();

      const exists = await repository.exists(nonExistentId);

      expect(exists).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete an existing user', async () => {
      const user = createTestUser();
      await repository.save(user);

      await repository.delete(user.getId());

      const found = await repository.findById(user.getId());
      expect(found).toBeNull();
    });

    it('should not throw when deleting non-existent user', async () => {
      const nonExistentId = UserId.create();

      // Should complete without throwing
      await repository.delete(nonExistentId);
      // If we reach here, no error was thrown
      expect(true).toBe(true);
    });

    it('should only delete the specified user', async () => {
      const user1 = createTestUser('user1@example.com');
      const user2 = createTestUser('user2@example.com');
      await repository.save(user1);
      await repository.save(user2);

      await repository.delete(user1.getId());

      expect(await repository.exists(user1.getId())).toBe(false);
      expect(await repository.exists(user2.getId())).toBe(true);
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent saves', async () => {
      const users = Array.from({ length: 10 }, (_, i) =>
        createTestUser(`user${i}@example.com`)
      );

      await Promise.all(users.map(user => repository.save(user)));

      // Verify all users exist
      const existsResults = await Promise.all(
        users.map(user => repository.exists(user.getId()))
      );
      expect(existsResults.every(exists => exists)).toBe(true);
    });

    it('should handle concurrent reads', async () => {
      const user = createTestUser();
      await repository.save(user);

      const reads = await Promise.all(
        Array.from({ length: 10 }, () => repository.findById(user.getId()))
      );

      reads.forEach(found => {
        expect(found).not.toBeNull();
        expect(found!.getId().toValue()).toBe(user.getId().toValue());
      });
    });
  });

  describe('data integrity', () => {
    it('should preserve all user data through save and retrieve cycle', async () => {
      const userId = UserId.create();
      const email = Email.create('integrity@example.com').getValue();
      const password = Password.create('$2a$10$complexhash1234567890abcdefghijk').getValue();

      const user = User.reconstruct(userId, email, password, 'Test User', '11999999999', true, new Date());

      await repository.save(user);
      const retrieved = await repository.findById(userId);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.getId().toValue()).toBe(userId.toValue());
      expect(retrieved!.getEmail().getValue()).toBe('integrity@example.com');
      expect(retrieved!.getPassword().getHash()).toBe('$2a$10$complexhash1234567890abcdefghijk');
      expect(retrieved!.getCreatedAt()).toBeInstanceOf(Date);
    });
  });
});
