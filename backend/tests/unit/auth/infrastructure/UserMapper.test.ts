import { describe, it, expect } from 'vitest';
import { UserMapper } from '@auth/infrastructure/persistence/drizzle/UserMapper.ts';
import { User } from '@auth/domain/entities/User.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { Email } from '@auth/domain/value-objects/Email.ts';
import { Password } from '@auth/domain/value-objects/Password.ts';
import { Role } from '@auth/domain/value-objects/Role.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import type { UserSchema } from '@auth/infrastructure/persistence/drizzle/schema.ts';

// Pre-generated valid Argon2 hash for testing (password: 'ValidPassword123!')
// This avoids requiring Bun's password hashing during unit tests
const VALID_HASH = '$argon2id$v=19$m=65536,t=2,p=1$GQyF5CIQtLdE0dxl+qfBiA$TH7VGmNFjuNOjJGPmHgvnqzGxRKlGXgQRnGJPCdmNjY';

describe('UserMapper', () => {
  const validFullName = 'Test User';
  const validPhone = '11999999999';

  describe('toPersistence', () => {
    it('should convert User to persistence format', () => {
      // Create a valid user
      const userId = UserId.create();
      const email = Email.create('test@example.com').getValue();
      const hashedPassword = VALID_HASH;
      const password = Password.create(hashedPassword).getValue();
      const createdAt = new Date();

      const user = User.reconstruct(userId, email, password, validFullName, validPhone, true, createdAt, []);

      const result = UserMapper.toPersistence(user);

      expect(result.id).toBe(userId.toValue());
      expect(result.email).toBe('test@example.com');
      expect(result.password).toBe(hashedPassword);
      expect(result.fullName).toBe(validFullName);
      expect(result.phone).toBe(validPhone);
      expect(result.isActive).toBe(true);
      expect(result.createdAt).toBe(createdAt);
    });

    it('should include all required fields', () => {
      const userId = UserId.create();
      const email = Email.create('user@domain.com').getValue();
      const hashedPassword = VALID_HASH;
      const password = Password.create(hashedPassword).getValue();
      const createdAt = new Date('2024-01-01');

      const user = User.reconstruct(userId, email, password, validFullName, validPhone, true, createdAt, [Role.user()]);

      const result = UserMapper.toPersistence(user);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('password');
      expect(result).toHaveProperty('fullName');
      expect(result).toHaveProperty('phone');
      expect(result).toHaveProperty('isActive');
      expect(result).toHaveProperty('createdAt');
    });
  });

  describe('toDomain', () => {
    it('should convert valid database row to User', () => {
      const hashedPassword = VALID_HASH;
      const rawData: UserSchema = {
        id: UserId.create().toValue(),
        email: 'test@example.com',
        password: hashedPassword,
        fullName: validFullName,
        phone: validPhone,
        isActive: true,
        photoUrl: null,
        createdAt: new Date(),
      };

      const result = UserMapper.toDomain(rawData);

      expect(result.isOk).toBe(true);
      const user = result.getValue();
      expect(user.getEmail().getValue()).toBe('test@example.com');
      expect(user.getFullName()).toBe(validFullName);
      expect(user.getPhone()).toBe(validPhone);
      expect(user.isActive()).toBe(true);
    });

    it('should convert database row with roles', () => {
      const hashedPassword = VALID_HASH;
      const roles = [Role.admin(), Role.user()];
      const rawData: UserSchema = {
        id: UserId.create().toValue(),
        email: 'admin@example.com',
        password: hashedPassword,
        fullName: validFullName,
        phone: validPhone,
        isActive: true,
        photoUrl: null,
        createdAt: new Date(),
      };

      const result = UserMapper.toDomain(rawData, roles);

      expect(result.isOk).toBe(true);
      const user = result.getValue();
      expect(user.getRoles()).toHaveLength(2);
      expect(user.hasRole(Role.admin())).toBe(true);
    });

    it('should fail with invalid user ID', () => {
      const hashedPassword = VALID_HASH;
      const rawData: UserSchema = {
        id: 'not-a-valid-uuid',
        email: 'test@example.com',
        password: hashedPassword,
        fullName: validFullName,
        phone: validPhone,
        isActive: true,
        photoUrl: null,
        createdAt: new Date(),
      };

      const result = UserMapper.toDomain(rawData);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.MAPPER_INVALID_USER_ID);
    });

    it('should fail with invalid email', () => {
      const hashedPassword = VALID_HASH;
      const rawData: UserSchema = {
        id: UserId.create().toValue(),
        email: 'not-a-valid-email',
        password: hashedPassword,
        fullName: validFullName,
        phone: validPhone,
        isActive: true,
        photoUrl: null,
        createdAt: new Date(),
      };

      const result = UserMapper.toDomain(rawData);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.MAPPER_INVALID_EMAIL);
    });

    it('should fail with invalid password hash (empty)', () => {
      const rawData: UserSchema = {
        id: UserId.create().toValue(),
        email: 'test@example.com',
        password: '', // Empty password hash
        fullName: validFullName,
        phone: validPhone,
        isActive: true,
        photoUrl: null,
        createdAt: new Date(),
      };

      const result = UserMapper.toDomain(rawData);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.MAPPER_INVALID_PASSWORD_HASH);
    });

    it('should fail with invalid password hash (too short)', () => {
      const rawData: UserSchema = {
        id: UserId.create().toValue(),
        email: 'test@example.com',
        password: 'short', // Too short to be a valid hash
        fullName: validFullName,
        phone: validPhone,
        isActive: true,
        photoUrl: null,
        createdAt: new Date(),
      };

      const result = UserMapper.toDomain(rawData);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.MAPPER_INVALID_PASSWORD_HASH);
    });

    it('should use empty roles array when not provided', () => {
      const hashedPassword = VALID_HASH;
      const rawData: UserSchema = {
        id: UserId.create().toValue(),
        email: 'test@example.com',
        password: hashedPassword,
        fullName: validFullName,
        phone: validPhone,
        isActive: true,
        photoUrl: null,
        createdAt: new Date(),
      };

      const result = UserMapper.toDomain(rawData);

      expect(result.isOk).toBe(true);
      const user = result.getValue();
      expect(user.getRoles()).toHaveLength(0);
    });

    it('should preserve createdAt date', () => {
      const hashedPassword = VALID_HASH;
      const createdAt = new Date('2023-06-15T10:30:00Z');
      const rawData: UserSchema = {
        id: UserId.create().toValue(),
        email: 'test@example.com',
        password: hashedPassword,
        fullName: validFullName,
        phone: validPhone,
        isActive: true,
        photoUrl: null,
        createdAt,
      };

      const result = UserMapper.toDomain(rawData);

      expect(result.isOk).toBe(true);
      const user = result.getValue();
      expect(user.getCreatedAt()).toEqual(createdAt);
    });
  });

  describe('round-trip conversion', () => {
    it('should maintain data integrity through toPersistence -> toDomain', () => {
      // Create original user
      const userId = UserId.create();
      const email = Email.create('roundtrip@example.com').getValue();
      const hashedPassword = VALID_HASH;
      const password = Password.create(hashedPassword).getValue();
      const createdAt = new Date('2024-03-01T12:00:00Z');
      const roles = [Role.user()];

      const originalUser = User.reconstruct(
        userId,
        email,
        password,
        validFullName,
        validPhone,
        true,
        createdAt,
        roles
      );

      // Convert to persistence
      const persisted = UserMapper.toPersistence(originalUser);

      // Convert back to domain
      const domainResult = UserMapper.toDomain(
        {
          id: persisted.id,
          email: persisted.email,
          password: persisted.password,
          fullName: persisted.fullName,
          phone: persisted.phone,
          isActive: persisted.isActive,
          photoUrl: persisted.photoUrl,
          createdAt: persisted.createdAt,
        },
        roles
      );

      expect(domainResult.isOk).toBe(true);
      const recoveredUser = domainResult.getValue();

      expect(recoveredUser.getId().toValue()).toBe(originalUser.getId().toValue());
      expect(recoveredUser.getEmail().getValue()).toBe(originalUser.getEmail().getValue());
      expect(recoveredUser.getPassword().getHash()).toBe(originalUser.getPassword().getHash());
      expect(recoveredUser.getFullName()).toBe(originalUser.getFullName());
      expect(recoveredUser.getPhone()).toBe(originalUser.getPhone());
      expect(recoveredUser.isActive()).toBe(originalUser.isActive());
      expect(recoveredUser.getCreatedAt().getTime()).toBe(originalUser.getCreatedAt().getTime());
      expect(recoveredUser.getRoles()).toHaveLength(1);
    });
  });
});
