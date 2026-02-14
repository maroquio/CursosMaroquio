import { describe, test, expect, beforeEach } from 'vitest';
import { GetUserHandler } from '@auth/application/queries/get-user/GetUserHandler.ts';
import { GetUserQuery } from '@auth/application/queries/get-user/GetUserQuery.ts';
import {
  type IUserRepository,
  type UserFilters,
  type PaginatedUsers,
} from '@auth/domain/repositories/IUserRepository.ts';
import { User } from '@auth/domain/entities/User.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { Email } from '@auth/domain/value-objects/Email.ts';
import { Password } from '@auth/domain/value-objects/Password.ts';
import { ErrorCode, getErrorMessage } from '@shared/domain/errors/ErrorCodes.ts';

// Mock implementation
class MockUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async save(user: User): Promise<void> {
    this.users.set(user.getId().toValue(), user);
  }

  async findById(id: UserId): Promise<User | null> {
    return this.users.get(id.toValue()) ?? null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.getEmail().equals(email)) {
        return user;
      }
    }
    return null;
  }

  async existsByEmail(email: Email): Promise<boolean> {
    for (const user of this.users.values()) {
      if (user.getEmail().equals(email)) {
        return true;
      }
    }
    return false;
  }

  async delete(id: UserId): Promise<void> {
    this.users.delete(id.toValue());
  }

  async exists(id: UserId): Promise<boolean> {
    return this.users.has(id.toValue());
  }

  async findAllPaginated(
    page: number,
    limit: number,
    _filters?: UserFilters
  ): Promise<PaginatedUsers> {
    const users = Array.from(this.users.values());
    return {
      users,
      total: users.length,
      page,
      limit,
      totalPages: Math.ceil(users.length / limit),
    };
  }

  async count(_filters?: UserFilters): Promise<number> {
    return this.users.size;
  }

  // Helper for tests
  addUser(user: User): void {
    this.users.set(user.getId().toValue(), user);
  }

  clear(): void {
    this.users.clear();
  }
}

// Helper to create test user
function createTestUser(
  id: string,
  email: string,
  createdAt: Date = new Date()
): User {
  const userId = UserId.createFromString(id).getValue();
  const emailVo = Email.create(email).getValue();
  const password = Password.create('$2a$10$hashedpassword123456789012345678901234567890').getValue();

  return User.reconstruct(userId, emailVo, password, 'Test User', '11999999999', true, createdAt);
}

describe('GetUserHandler', () => {
  let handler: GetUserHandler;
  let userRepository: MockUserRepository;

  const validUserId = '019364c6-8c2a-7d8e-8a3b-1c2d3e4f5a6b';

  beforeEach(() => {
    userRepository = new MockUserRepository();
    handler = new GetUserHandler(userRepository);
  });

  describe('successful retrieval', () => {
    test('should return user data when user exists', async () => {
      const testUser = createTestUser(validUserId, 'user@example.com');
      userRepository.addUser(testUser);

      const query = new GetUserQuery(validUserId);
      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const dto = result.getValue();
      expect(dto.id).toBe(validUserId);
      expect(dto.email).toBe('user@example.com');
    });

    test('should return correct email format', async () => {
      const testUser = createTestUser(validUserId, 'Test@Example.COM');
      userRepository.addUser(testUser);

      const query = new GetUserQuery(validUserId);
      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      expect(result.getValue().email).toBe('test@example.com');
    });

    test('should return createdAt timestamp', async () => {
      const createdAt = new Date('2024-01-15T10:30:00Z');
      const testUser = createTestUser(validUserId, 'user@example.com', createdAt);
      userRepository.addUser(testUser);

      const query = new GetUserQuery(validUserId);
      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      expect(result.getValue().createdAt).toEqual(createdAt);
    });
  });

  describe('user not found', () => {
    test('should fail when user does not exist', async () => {
      const query = new GetUserQuery(validUserId);
      const result = await handler.execute(query);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('not found');
    });

    test('should fail when searching for different user', async () => {
      const existingUserId = '019364c6-8c2a-7d8e-8a3b-1c2d3e4f5a6b';
      const searchUserId = '019364c6-8c2a-7d8e-9b4c-2d3e4f5a6b7c';

      const testUser = createTestUser(existingUserId, 'user@example.com');
      userRepository.addUser(testUser);

      const query = new GetUserQuery(searchUserId);
      const result = await handler.execute(query);

      expect(result.isFailure).toBe(true);
    });
  });

  describe('invalid user ID', () => {
    test('should fail with invalid UUID format', async () => {
      const query = new GetUserQuery('invalid-uuid');
      const result = await handler.execute(query);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(getErrorMessage(ErrorCode.INVALID_USER_ID));
    });

    test('should fail with empty user ID', async () => {
      const query = new GetUserQuery('');
      const result = await handler.execute(query);

      expect(result.isFailure).toBe(true);
    });

    test('should fail with UUID v4 instead of v7', async () => {
      // UUID v4 has 4 in the version position
      const uuidV4 = '550e8400-e29b-41d4-a716-446655440000';
      const query = new GetUserQuery(uuidV4);
      const result = await handler.execute(query);

      expect(result.isFailure).toBe(true);
    });
  });

  describe('DTO structure', () => {
    test('should return correct DTO structure', async () => {
      const testUser = createTestUser(validUserId, 'user@example.com');
      userRepository.addUser(testUser);

      const query = new GetUserQuery(validUserId);
      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const dto = result.getValue();

      // Check structure
      expect(dto).toHaveProperty('id');
      expect(dto).toHaveProperty('email');
      expect(dto).toHaveProperty('createdAt');

      // Should NOT expose password
      expect(dto).not.toHaveProperty('password');
    });
  });

  describe('query properties', () => {
    test('query should store userId', () => {
      const query = new GetUserQuery('test-user-id');

      expect(query.userId).toBe('test-user-id');
    });
  });
});
