import { describe, it, expect, beforeEach } from 'vitest';
import { RemoveRoleHandler } from '@auth/application/commands/remove-role/RemoveRoleHandler.ts';
import { RemoveRoleCommand } from '@auth/application/commands/remove-role/RemoveRoleCommand.ts';
import {
  MockUserRepository,
  createTestAdmin,
  createTestUser,
} from '../../mocks/index.ts';
import { Role, SystemRoles } from '@auth/domain/value-objects/Role.ts';
import { User } from '@auth/domain/entities/User.ts';
import { Email } from '@auth/domain/value-objects/Email.ts';
import { Password } from '@auth/domain/value-objects/Password.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

describe('RemoveRoleHandler', () => {
  let handler: RemoveRoleHandler;
  let userRepository: MockUserRepository;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    handler = new RemoveRoleHandler(userRepository);
  });

  /**
   * Helper to create a user with multiple roles
   */
  function createUserWithRoles(emailStr: string, ...roleNames: string[]): User {
    const email = Email.create(emailStr).getValue();
    const password = Password.create('$2a$10$hashedpasswordvalue123456789').getValue();
    const roles = roleNames.map((name) => Role.create(name).getValue());
    return User.create(email, password, 'Test User', '11999999999', roles).getValue();
  }

  describe('successful role removal', () => {
    it('should remove a role when admin requests it', async () => {
      const admin = createTestAdmin();
      // Create user with two roles so we can remove one
      const targetUser = createUserWithRoles('target@example.com', 'user', 'editor');
      userRepository.addUser(admin);
      userRepository.addUser(targetUser);

      const command = new RemoveRoleCommand(
        targetUser.getId().toValue(),
        'editor',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
    });

    it('should persist the role removal', async () => {
      const admin = createTestAdmin();
      const targetUser = createUserWithRoles('target@example.com', 'user', 'editor', 'moderator');
      userRepository.addUser(admin);
      userRepository.addUser(targetUser);

      const command = new RemoveRoleCommand(
        targetUser.getId().toValue(),
        'editor',
        admin.getId().toValue()
      );

      await handler.execute(command);

      const savedUser = await userRepository.findById(targetUser.getId());
      expect(savedUser).not.toBeNull();
      expect(savedUser!.hasRole('editor')).toBe(false);
      expect(savedUser!.hasRole('user')).toBe(true);
      expect(savedUser!.hasRole('moderator')).toBe(true);
    });

    it('should normalize role name to lowercase', async () => {
      const admin = createTestAdmin();
      const targetUser = createUserWithRoles('target@example.com', 'user', 'editor');
      userRepository.addUser(admin);
      userRepository.addUser(targetUser);

      const command = new RemoveRoleCommand(
        targetUser.getId().toValue(),
        'EDITOR', // Uppercase
        admin.getId().toValue()
      );

      await handler.execute(command);

      const savedUser = await userRepository.findById(targetUser.getId());
      expect(savedUser!.hasRole('editor')).toBe(false);
    });
  });

  describe('authorization failures', () => {
    it('should fail when remover is not an admin', async () => {
      const nonAdmin = createTestUser('nonAdmin@example.com');
      const target = createUserWithRoles('target@example.com', 'user', 'editor');
      userRepository.addUser(nonAdmin);
      userRepository.addUser(target);

      const command = new RemoveRoleCommand(
        target.getId().toValue(),
        'editor',
        nonAdmin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('administrators');
    });

    it('should fail when remover is not found', async () => {
      const target = createUserWithRoles('target@example.com', 'user', 'editor');
      userRepository.addUser(target);

      const command = new RemoveRoleCommand(
        target.getId().toValue(),
        'editor',
        '019123ab-cdef-7890-abcd-ef1234567890'
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Remover not found');
    });

    it('should fail with invalid remover user ID format', async () => {
      const target = createUserWithRoles('target@example.com', 'user', 'editor');
      userRepository.addUser(target);

      const command = new RemoveRoleCommand(
        target.getId().toValue(),
        'editor',
        'invalid-id'
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Invalid remover user ID');
    });
  });

  describe('self-removal protection', () => {
    it('should prevent admin from removing their own admin role', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new RemoveRoleCommand(
        admin.getId().toValue(),
        SystemRoles.ADMIN,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Cannot remove your own admin role');
    });

    it('should allow admin to remove a non-admin role from themselves', async () => {
      // Create admin with multiple roles
      const email = Email.create('admin@example.com').getValue();
      const password = Password.create('$2a$10$hashedpasswordvalue123456789').getValue();
      const adminRole = Role.create(SystemRoles.ADMIN).getValue();
      const editorRole = Role.create('editor').getValue();
      const admin = User.create(email, password, 'Test Admin', '11999999999', [adminRole, editorRole]).getValue();
      userRepository.addUser(admin);

      const command = new RemoveRoleCommand(
        admin.getId().toValue(),
        'editor', // Not admin role
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      const savedUser = await userRepository.findById(admin.getId());
      expect(savedUser!.hasRole('editor')).toBe(false);
      expect(savedUser!.isAdmin()).toBe(true);
    });

    it('should allow admin to remove admin role from another user', async () => {
      const admin1 = createTestAdmin('admin1@example.com');
      const admin2 = createUserWithRoles('admin2@example.com', SystemRoles.ADMIN, 'user');
      userRepository.addUser(admin1);
      userRepository.addUser(admin2);

      const command = new RemoveRoleCommand(
        admin2.getId().toValue(),
        SystemRoles.ADMIN,
        admin1.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      const savedUser = await userRepository.findById(admin2.getId());
      expect(savedUser!.isAdmin()).toBe(false);
    });
  });

  describe('validation failures', () => {
    it('should fail with invalid target user ID format', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new RemoveRoleCommand(
        'invalid-id',
        'editor',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Invalid target user ID');
    });

    it('should fail when target user is not found', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new RemoveRoleCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        'editor',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Target user not found');
    });

    it('should fail with invalid role name format', async () => {
      const admin = createTestAdmin();
      const target = createUserWithRoles('target@example.com', 'user', 'editor');
      userRepository.addUser(admin);
      userRepository.addUser(target);

      const command = new RemoveRoleCommand(
        target.getId().toValue(),
        'invalid role', // Contains space
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
    });

    it('should fail when user does not have the role', async () => {
      const admin = createTestAdmin();
      const target = createTestUser('target@example.com');
      userRepository.addUser(admin);
      userRepository.addUser(target);

      const command = new RemoveRoleCommand(
        target.getId().toValue(),
        'editor', // User doesn't have this role
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain(ErrorCode.USER_DOES_NOT_HAVE_ROLE);
    });

    it('should fail when trying to remove the last role', async () => {
      const admin = createTestAdmin();
      const target = createTestUser('target@example.com'); // Has only 'user' role
      userRepository.addUser(admin);
      userRepository.addUser(target);

      const command = new RemoveRoleCommand(
        target.getId().toValue(),
        SystemRoles.USER,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain(ErrorCode.ROLE_CANNOT_REMOVE_LAST);
    });
  });

  describe('command properties', () => {
    it('should correctly store command properties', () => {
      const command = new RemoveRoleCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        'editor',
        '019123ab-cdef-7890-abcd-ef1234567891'
      );

      expect(command.targetUserId).toBe('019123ab-cdef-7890-abcd-ef1234567890');
      expect(command.roleName).toBe('editor');
      expect(command.removedByUserId).toBe('019123ab-cdef-7890-abcd-ef1234567891');
    });
  });
});
