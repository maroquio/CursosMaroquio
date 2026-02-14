import { describe, it, expect, beforeEach } from 'vitest';
import { RemovePermissionFromUserHandler } from '@auth/application/commands/remove-permission-from-user/RemovePermissionFromUserHandler.ts';
import { RemovePermissionFromUserCommand } from '@auth/application/commands/remove-permission-from-user/RemovePermissionFromUserCommand.ts';
import {
  MockUserRepository,
  MockPermissionRepository,
  MockPermissionService,
  createTestAdmin,
  createTestUser,
  createTestPermission,
} from '../../mocks/index.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

describe('RemovePermissionFromUserHandler', () => {
  let handler: RemovePermissionFromUserHandler;
  let userRepository: MockUserRepository;
  let permissionRepository: MockPermissionRepository;
  let permissionService: MockPermissionService;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    permissionRepository = new MockPermissionRepository();
    permissionService = new MockPermissionService();
    handler = new RemovePermissionFromUserHandler(
      userRepository,
      permissionRepository,
      permissionService
    );
  });

  describe('successful permission removal', () => {
    it('should remove a permission from a user when admin requests it', async () => {
      const admin = createTestAdmin();
      const targetUser = createTestUser('target@example.com');
      userRepository.addUser(admin);
      userRepository.addUser(targetUser);

      const permission = createTestPermission('posts:write');
      permissionRepository.addPermission(permission);

      // Assign permission to user first
      await permissionRepository.assignToUser(
        permission.id,
        targetUser.getId()
      );

      const command = new RemovePermissionFromUserCommand(
        targetUser.getId().toValue(),
        permission.name,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
    });

    it('should invalidate user permission cache after removal', async () => {
      const admin = createTestAdmin();
      const targetUser = createTestUser('target@example.com');
      userRepository.addUser(admin);
      userRepository.addUser(targetUser);

      const permission = createTestPermission('posts:read');
      permissionRepository.addPermission(permission);
      await permissionRepository.assignToUser(permission.id, targetUser.getId());

      const command = new RemovePermissionFromUserCommand(
        targetUser.getId().toValue(),
        permission.name,
        admin.getId().toValue()
      );

      await handler.execute(command);

      expect(permissionService.wasInvalidated(targetUser.getId().toValue())).toBe(true);
    });

    it('should normalize permission name to lowercase', async () => {
      const admin = createTestAdmin();
      const targetUser = createTestUser('target@example.com');
      userRepository.addUser(admin);
      userRepository.addUser(targetUser);

      const permission = createTestPermission('posts:delete');
      permissionRepository.addPermission(permission);
      await permissionRepository.assignToUser(permission.id, targetUser.getId());

      const command = new RemovePermissionFromUserCommand(
        targetUser.getId().toValue(),
        'POSTS:DELETE', // Uppercase
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
    });
  });

  describe('authorization failures', () => {
    it('should fail when remover is not an admin', async () => {
      const regularUser = createTestUser('remover@example.com');
      const targetUser = createTestUser('target@example.com');
      userRepository.addUser(regularUser);
      userRepository.addUser(targetUser);

      const permission = createTestPermission('posts:write');
      permissionRepository.addPermission(permission);

      const command = new RemovePermissionFromUserCommand(
        targetUser.getId().toValue(),
        permission.name,
        regularUser.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('administrators');
    });

    it('should fail when remover is not found', async () => {
      const targetUser = createTestUser('target@example.com');
      userRepository.addUser(targetUser);

      const permission = createTestPermission('posts:write');
      permissionRepository.addPermission(permission);

      const command = new RemovePermissionFromUserCommand(
        targetUser.getId().toValue(),
        permission.name,
        '019123ab-cdef-7890-abcd-ef1234567890'
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain(ErrorCode.USER_NOT_FOUND);
    });

    it('should fail with invalid remover user ID format', async () => {
      const command = new RemovePermissionFromUserCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        'posts:read',
        'invalid-id'
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain(ErrorCode.INVALID_USER_ID);
    });
  });

  describe('validation failures', () => {
    it('should fail with invalid target user ID format', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new RemovePermissionFromUserCommand(
        'invalid-id',
        'posts:read',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain(ErrorCode.INVALID_USER_ID);
    });

    it('should fail when target user is not found', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const permission = createTestPermission('posts:read');
      permissionRepository.addPermission(permission);

      const command = new RemovePermissionFromUserCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        permission.name,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain(ErrorCode.USER_NOT_FOUND);
    });

    it('should fail when permission is not found', async () => {
      const admin = createTestAdmin();
      const targetUser = createTestUser('target@example.com');
      userRepository.addUser(admin);
      userRepository.addUser(targetUser);

      const command = new RemovePermissionFromUserCommand(
        targetUser.getId().toValue(),
        'nonexistent:permission',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('not found');
    });

    it('should fail when user does not have the individual permission', async () => {
      const admin = createTestAdmin();
      const targetUser = createTestUser('target@example.com');
      userRepository.addUser(admin);
      userRepository.addUser(targetUser);

      const permission = createTestPermission('posts:write');
      permissionRepository.addPermission(permission);
      // Note: Not assigning permission to user

      const command = new RemovePermissionFromUserCommand(
        targetUser.getId().toValue(),
        permission.name,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain(ErrorCode.USER_DOES_NOT_HAVE_PERMISSION);
    });
  });

  describe('command properties', () => {
    it('should correctly store command properties', () => {
      const command = new RemovePermissionFromUserCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        'posts:write',
        '019123ab-cdef-7890-abcd-ef1234567891'
      );

      expect(command.targetUserId).toBe('019123ab-cdef-7890-abcd-ef1234567890');
      expect(command.permissionName).toBe('posts:write');
      expect(command.removedByUserId).toBe('019123ab-cdef-7890-abcd-ef1234567891');
    });
  });
});
