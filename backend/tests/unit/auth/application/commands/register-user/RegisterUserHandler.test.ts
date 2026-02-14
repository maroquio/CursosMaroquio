import { describe, test, expect, beforeEach } from 'vitest';
import { RegisterUserHandler } from '@auth/application/commands/register-user/RegisterUserHandler.ts';
import { RegisterUserCommand } from '@auth/application/commands/register-user/RegisterUserCommand.ts';
import type { IPasswordHasher } from '@auth/domain/services/IPasswordHasher.ts';
import {
  type IUserRepository,
  type UserFilters,
  type PaginatedUsers,
} from '@auth/domain/repositories/IUserRepository.ts';
import { User } from '@auth/domain/entities/User.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { Email } from '@auth/domain/value-objects/Email.ts';
import { Password } from '@auth/domain/value-objects/Password.ts';

// Mock implementations
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
  clear(): void {
    this.users.clear();
  }

  getAll(): User[] {
    return Array.from(this.users.values());
  }
}

class MockPasswordHasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    // Simulate bcrypt hash format (60 chars)
    return `$2a$10$${password.padEnd(53, 'x')}`;
  }

  async compare(password: string, hash: string): Promise<boolean> {
    const expectedHash = await this.hash(password);
    return hash === expectedHash;
  }
}

describe('RegisterUserHandler', () => {
  let handler: RegisterUserHandler;
  let userRepository: MockUserRepository;
  let passwordHasher: MockPasswordHasher;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    passwordHasher = new MockPasswordHasher();
    handler = new RegisterUserHandler(userRepository, passwordHasher);
  });

  describe('successful registration', () => {
    test('should register a new user successfully', async () => {
      const command = new RegisterUserCommand('user@example.com', 'password123', 'Test User', '11999999999');

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
    });

    test('should save user to repository', async () => {
      const command = new RegisterUserCommand('user@example.com', 'password123', 'Test User', '11999999999');

      await handler.execute(command);

      const users = userRepository.getAll();
      expect(users.length).toBe(1);
      expect(users[0]?.getEmail().getValue()).toBe('user@example.com');
    });

    test('should hash the password before saving', async () => {
      const command = new RegisterUserCommand('user@example.com', 'password123', 'Test User', '11999999999');

      await handler.execute(command);

      const users = userRepository.getAll();
      const savedUser = users[0];
      expect(savedUser?.getPassword().getHash()).toContain('$2a$10$');
      expect(savedUser?.getPassword().getHash()).not.toBe('password123');
    });

    test('should normalize email to lowercase', async () => {
      const command = new RegisterUserCommand('User@Example.COM', 'password123', 'Test User', '11999999999');

      await handler.execute(command);

      const users = userRepository.getAll();
      expect(users[0]?.getEmail().getValue()).toBe('user@example.com');
    });
  });

  describe('validation errors', () => {
    test('should fail with invalid email format', async () => {
      const command = new RegisterUserCommand('invalid-email', 'password123', 'Test User', '11999999999');

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Invalid email');
    });

    test('should fail with empty email', async () => {
      const command = new RegisterUserCommand('', 'password123', 'Test User', '11999999999');

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
    });
  });

  describe('business rule violations', () => {
    test('should fail when user with email already exists', async () => {
      // First registration
      const command1 = new RegisterUserCommand('existing@example.com', 'password123', 'Test User', '11999999999');
      await handler.execute(command1);

      // Second registration with same email
      const command2 = new RegisterUserCommand('existing@example.com', 'different456', 'Another User', '11888888888');
      const result = await handler.execute(command2);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('already exists');
    });

    test('should fail when email exists (case insensitive)', async () => {
      const command1 = new RegisterUserCommand('user@example.com', 'password123', 'Test User', '11999999999');
      await handler.execute(command1);

      const command2 = new RegisterUserCommand('USER@EXAMPLE.COM', 'password456', 'Another User', '11888888888');
      const result = await handler.execute(command2);

      expect(result.isFailure).toBe(true);
    });
  });

  describe('error handling', () => {
    test('should handle password hashing failure', async () => {
      const failingHasher: IPasswordHasher = {
        async hash(): Promise<string> {
          throw new Error('Hashing failed');
        },
        async compare(): Promise<boolean> {
          return false;
        },
      };

      const handlerWithFailingHasher = new RegisterUserHandler(
        userRepository,
        failingHasher
      );

      const command = new RegisterUserCommand('user@example.com', 'password123', 'Test User', '11999999999');
      const result = await handlerWithFailingHasher.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('hash password');
    });

    test('should handle repository save failure', async () => {
      const failingRepo: IUserRepository = {
        async save(): Promise<void> {
          throw new Error('Database error');
        },
        async existsByEmail(): Promise<boolean> {
          return false;
        },
        async findById() {
          return null;
        },
        async findByEmail() {
          return null;
        },
        async delete() {},
        async exists() {
          return false;
        },
        async findAllPaginated() {
          return { users: [], total: 0, page: 1, limit: 20, totalPages: 0 };
        },
        async count() {
          return 0;
        },
      };

      const handlerWithFailingRepo = new RegisterUserHandler(
        failingRepo,
        passwordHasher
      );

      const command = new RegisterUserCommand('user@example.com', 'password123', 'Test User', '11999999999');
      const result = await handlerWithFailingRepo.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('save user');
    });
  });

  describe('command properties', () => {
    test('command should store email and password', () => {
      const command = new RegisterUserCommand('test@example.com', 'secret123', 'Test User', '11999999999');

      expect(command.email).toBe('test@example.com');
      expect(command.password).toBe('secret123');
    });
  });
});
