import { describe, it, expect, beforeEach } from 'vitest';
import { AssignPermissionToUserHandler } from '@auth/application/commands/assign-permission-to-user/AssignPermissionToUserHandler.ts';
import { AssignPermissionToUserCommand } from '@auth/application/commands/assign-permission-to-user/AssignPermissionToUserCommand.ts';
import {
  MockUserRepository,
  MockPermissionRepository,
  MockPermissionService,
  createTestAdmin,
  createTestUser,
  createTestPermission,
} from '../../mocks/index.ts';

describe('AssignPermissionToUserHandler', () => {
  let handler: AssignPermissionToUserHandler;
  let userRepository: MockUserRepository;
  let permissionRepository: MockPermissionRepository;
  let permissionService: MockPermissionService;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    permissionRepository = new MockPermissionRepository();
    permissionService = new MockPermissionService();
    handler = new AssignPermissionToUserHandler(
      userRepository,
      permissionRepository,
      permissionService
    );
  });

  describe('successful permission assignment', () => {
    it('should assign a permission to a user when admin requests it', async () => {
      const admin = createTestAdmin();
      const targetUser = createTestUser('target@example.com');
      userRepository.addUser(admin);
      userRepository.addUser(targetUser);

      const permission = createTestPermission('posts:write');
      permissionRepository.addPermission(permission);

      const command = new AssignPermissionToUserCommand(
        targetUser.getId().toValue(),
        permission.name,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
    });

    it('should invalidate user permission cache after assignment', async () => {
      const admin = createTestAdmin();
      const targetUser = createTestUser('target@example.com');
      userRepository.addUser(admin);
      userRepository.addUser(targetUser);

      const permission = createTestPermission('posts:read');
      permissionRepository.addPermission(permission);

      const command = new AssignPermissionToUserCommand(
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

      const command = new AssignPermissionToUserCommand(
        targetUser.getId().toValue(),
        'POSTS:DELETE', // Uppercase
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
    });

    it('should allow assigning multiple permissions to the same user', async () => {
      const admin = createTestAdmin();
      const targetUser = createTestUser('target@example.com');
      userRepository.addUser(admin);
      userRepository.addUser(targetUser);

      const perm1 = createTestPermission('posts:read');
      const perm2 = createTestPermission('posts:write');
      permissionRepository.addPermission(perm1);
      permissionRepository.addPermission(perm2);

      // First assignment
      const cmd1 = new AssignPermissionToUserCommand(
        targetUser.getId().toValue(),
        perm1.name,
        admin.getId().toValue()
      );
      await handler.execute(cmd1);

      // Second assignment
      const cmd2 = new AssignPermissionToUserCommand(
        targetUser.getId().toValue(),
        perm2.name,
        admin.getId().toValue()
      );
      const result = await handler.execute(cmd2);

      expect(result.isOk).toBe(true);
    });

    it('should allow assigning wildcard permissions', async () => {
      const admin = createTestAdmin();
      const targetUser = createTestUser('target@example.com');
      userRepository.addUser(admin);
      userRepository.addUser(targetUser);

      const wildcardPermission = createTestPermission('posts:*');
      permissionRepository.addPermission(wildcardPermission);

      const command = new AssignPermissionToUserCommand(
        targetUser.getId().toValue(),
        wildcardPermission.name,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
    });
  });

  describe('authorization failures', () => {
    it('should fail when assigner is not an admin', async () => {
      const regularUser = createTestUser('assigner@example.com');
      const targetUser = createTestUser('target@example.com');
      userRepository.addUser(regularUser);
      userRepository.addUser(targetUser);

      const permission = createTestPermission('posts:write');
      permissionRepository.addPermission(permission);

      const command = new AssignPermissionToUserCommand(
        targetUser.getId().toValue(),
        permission.name,
        regularUser.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('administrators');
    });

    it('should fail when assigner is not found', async () => {
      const targetUser = createTestUser('target@example.com');
      userRepository.addUser(targetUser);

      const permission = createTestPermission('posts:write');
      permissionRepository.addPermission(permission);

      const command = new AssignPermissionToUserCommand(
        targetUser.getId().toValue(),
        permission.name,
        '019123ab-cdef-7890-abcd-ef1234567890'
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('not found');
    });

    it('should fail with invalid assigner user ID format', async () => {
      const command = new AssignPermissionToUserCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        'posts:read',
        'invalid-id'
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Invalid');
    });
  });

  describe('validation failures', () => {
    it('should fail with invalid target user ID format', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new AssignPermissionToUserCommand(
        'invalid-id',
        'posts:read',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Invalid');
    });

    it('should fail when target user is not found', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const permission = createTestPermission('posts:read');
      permissionRepository.addPermission(permission);

      const command = new AssignPermissionToUserCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        permission.name,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('not found');
    });

    it('should fail when permission is not found', async () => {
      const admin = createTestAdmin();
      const targetUser = createTestUser('target@example.com');
      userRepository.addUser(admin);
      userRepository.addUser(targetUser);

      const command = new AssignPermissionToUserCommand(
        targetUser.getId().toValue(),
        'nonexistent:permission',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('not found');
    });

    it('should fail when user already has the individual permission', async () => {
      const admin = createTestAdmin();
      const targetUser = createTestUser('target@example.com');
      userRepository.addUser(admin);
      userRepository.addUser(targetUser);

      const permission = createTestPermission('posts:write');
      permissionRepository.addPermission(permission);

      // Assign permission first
      await permissionRepository.assignToUser(permission.id, targetUser.getId());

      const command = new AssignPermissionToUserCommand(
        targetUser.getId().toValue(),
        permission.name,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('already has');
    });
  });

  describe('edge cases', () => {
    it('should allow admin to assign permission to themselves', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const permission = createTestPermission('special:access');
      permissionRepository.addPermission(permission);

      const command = new AssignPermissionToUserCommand(
        admin.getId().toValue(),
        permission.name,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
    });
  });

  describe('command properties', () => {
    it('should correctly store command properties', () => {
      const command = new AssignPermissionToUserCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        'posts:write',
        '019123ab-cdef-7890-abcd-ef1234567891'
      );

      expect(command.targetUserId).toBe('019123ab-cdef-7890-abcd-ef1234567890');
      expect(command.permissionName).toBe('posts:write');
      expect(command.assignedByUserId).toBe('019123ab-cdef-7890-abcd-ef1234567891');
    });
  });
});
