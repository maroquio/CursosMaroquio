import { describe, it, expect, beforeEach } from 'vitest';
import { AssignRoleHandler } from '@auth/application/commands/assign-role/AssignRoleHandler.ts';
import { AssignRoleCommand } from '@auth/application/commands/assign-role/AssignRoleCommand.ts';
import {
  MockUserRepository,
  MockRoleRepository,
  createTestAdmin,
  createTestUser,
} from '../../mocks/index.ts';
import { Role, SystemRoles } from '@auth/domain/value-objects/Role.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

describe('AssignRoleHandler', () => {
  let handler: AssignRoleHandler;
  let userRepository: MockUserRepository;
  let roleRepository: MockRoleRepository;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    roleRepository = new MockRoleRepository();
    handler = new AssignRoleHandler(userRepository, roleRepository);
  });

  describe('successful role assignment', () => {
    it('should assign a role when admin requests it', async () => {
      const admin = createTestAdmin();
      const regularUser = createTestUser('target@example.com');
      userRepository.addUser(admin);
      userRepository.addUser(regularUser);

      const command = new AssignRoleCommand(
        regularUser.getId().toValue(),
        'editor',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
    });

    it('should persist the role assignment', async () => {
      const admin = createTestAdmin();
      const regularUser = createTestUser('target@example.com');
      userRepository.addUser(admin);
      userRepository.addUser(regularUser);

      const command = new AssignRoleCommand(
        regularUser.getId().toValue(),
        'moderator',
        admin.getId().toValue()
      );

      await handler.execute(command);

      // Verify user was saved with new role
      const savedUser = await userRepository.findById(regularUser.getId());
      expect(savedUser).not.toBeNull();
      expect(savedUser!.hasRole('moderator')).toBe(true);
    });

    it('should normalize role name to lowercase', async () => {
      const admin = createTestAdmin();
      const regularUser = createTestUser('target@example.com');
      userRepository.addUser(admin);
      userRepository.addUser(regularUser);

      const command = new AssignRoleCommand(
        regularUser.getId().toValue(),
        'EDITOR',
        admin.getId().toValue()
      );

      await handler.execute(command);

      const savedUser = await userRepository.findById(regularUser.getId());
      expect(savedUser!.hasRole('editor')).toBe(true);
    });
  });

  describe('authorization failures', () => {
    it('should fail when assigner is not an admin', async () => {
      const nonAdmin = createTestUser('nonAdmin@example.com');
      const target = createTestUser('target@example.com');
      userRepository.addUser(nonAdmin);
      userRepository.addUser(target);

      const command = new AssignRoleCommand(
        target.getId().toValue(),
        'editor',
        nonAdmin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('administrators');
    });

    it('should fail when assigner is not found', async () => {
      const target = createTestUser('target@example.com');
      userRepository.addUser(target);

      const command = new AssignRoleCommand(
        target.getId().toValue(),
        'editor',
        '019123ab-cdef-7890-abcd-ef1234567890'
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Assigner not found');
    });

    it('should fail with invalid assigner user ID format', async () => {
      const target = createTestUser('target@example.com');
      userRepository.addUser(target);

      const command = new AssignRoleCommand(
        target.getId().toValue(),
        'editor',
        'invalid-id'
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Invalid assigner user ID');
    });
  });

  describe('validation failures', () => {
    it('should fail with invalid target user ID format', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new AssignRoleCommand(
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

      const command = new AssignRoleCommand(
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
      const target = createTestUser('target@example.com');
      userRepository.addUser(admin);
      userRepository.addUser(target);

      const command = new AssignRoleCommand(
        target.getId().toValue(),
        'invalid role', // Contains space
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
    });

    it('should fail with empty role name', async () => {
      const admin = createTestAdmin();
      const target = createTestUser('target@example.com');
      userRepository.addUser(admin);
      userRepository.addUser(target);

      const command = new AssignRoleCommand(
        target.getId().toValue(),
        '',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
    });

    it('should fail when user already has the role', async () => {
      const admin = createTestAdmin();
      const target = createTestUser('target@example.com');
      // User is created with 'user' role by default
      userRepository.addUser(admin);
      userRepository.addUser(target);

      const command = new AssignRoleCommand(
        target.getId().toValue(),
        SystemRoles.USER, // User already has this role
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.USER_ALREADY_HAS_ROLE);
    });
  });

  describe('edge cases', () => {
    it('should allow admin to assign admin role to another user', async () => {
      const admin = createTestAdmin();
      const target = createTestUser('target@example.com');
      userRepository.addUser(admin);
      userRepository.addUser(target);

      const command = new AssignRoleCommand(
        target.getId().toValue(),
        SystemRoles.ADMIN,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      const savedUser = await userRepository.findById(target.getId());
      expect(savedUser!.isAdmin()).toBe(true);
    });

    it('should allow assigning multiple different roles', async () => {
      const admin = createTestAdmin();
      const target = createTestUser('target@example.com');
      userRepository.addUser(admin);
      userRepository.addUser(target);

      // First assignment
      const command1 = new AssignRoleCommand(
        target.getId().toValue(),
        'editor',
        admin.getId().toValue()
      );
      await handler.execute(command1);

      // Second assignment
      const command2 = new AssignRoleCommand(
        target.getId().toValue(),
        'moderator',
        admin.getId().toValue()
      );
      const result = await handler.execute(command2);

      expect(result.isOk).toBe(true);
      const savedUser = await userRepository.findById(target.getId());
      expect(savedUser!.hasRole('editor')).toBe(true);
      expect(savedUser!.hasRole('moderator')).toBe(true);
    });
  });

  describe('command properties', () => {
    it('should correctly store command properties', () => {
      const command = new AssignRoleCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        'editor',
        '019123ab-cdef-7890-abcd-ef1234567891'
      );

      expect(command.targetUserId).toBe('019123ab-cdef-7890-abcd-ef1234567890');
      expect(command.roleName).toBe('editor');
      expect(command.assignedByUserId).toBe('019123ab-cdef-7890-abcd-ef1234567891');
    });
  });
});
