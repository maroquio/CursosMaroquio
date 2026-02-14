import { describe, it, expect, beforeEach } from 'vitest';
import { AssignPermissionToRoleHandler } from '@auth/application/commands/assign-permission-to-role/AssignPermissionToRoleHandler.ts';
import { AssignPermissionToRoleCommand } from '@auth/application/commands/assign-permission-to-role/AssignPermissionToRoleCommand.ts';
import {
  MockUserRepository,
  MockPermissionRepository,
  MockRoleRepository,
  createTestAdmin,
  createTestUser,
  createTestPermission,
  createTestRole,
} from '../../mocks/index.ts';

describe('AssignPermissionToRoleHandler', () => {
  let handler: AssignPermissionToRoleHandler;
  let userRepository: MockUserRepository;
  let roleRepository: MockRoleRepository;
  let permissionRepository: MockPermissionRepository;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    roleRepository = new MockRoleRepository();
    permissionRepository = new MockPermissionRepository();
    handler = new AssignPermissionToRoleHandler(
      userRepository,
      roleRepository,
      permissionRepository
    );
  });

  describe('successful permission assignment', () => {
    it('should assign a permission to a role when admin requests it', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const role = createTestRole('editor', 'Editor role');
      roleRepository.addRole(role);

      const permission = createTestPermission('posts:create', 'Create posts');
      permissionRepository.addPermission(permission);

      const command = new AssignPermissionToRoleCommand(
        role.id.toValue(),
        'posts:create',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
    });

    it('should normalize permission name to lowercase', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const role = createTestRole('editor');
      roleRepository.addRole(role);

      const permission = createTestPermission('posts:read');
      permissionRepository.addPermission(permission);

      const command = new AssignPermissionToRoleCommand(
        role.id.toValue(),
        'POSTS:READ',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
    });
  });

  describe('authorization failures', () => {
    it('should fail when assigner is not an admin', async () => {
      const regularUser = createTestUser();
      userRepository.addUser(regularUser);

      const role = createTestRole('editor');
      roleRepository.addRole(role);

      const permission = createTestPermission('posts:create');
      permissionRepository.addPermission(permission);

      const command = new AssignPermissionToRoleCommand(
        role.id.toValue(),
        'posts:create',
        regularUser.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('administrators');
    });

    it('should fail when assigner is not found', async () => {
      const role = createTestRole('editor');
      roleRepository.addRole(role);

      const command = new AssignPermissionToRoleCommand(
        role.id.toValue(),
        'posts:create',
        '019123ab-cdef-7890-abcd-ef1234567890'
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('not found');
    });

    it('should fail with invalid assigner user ID format', async () => {
      const command = new AssignPermissionToRoleCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        'posts:create',
        'invalid-user-id'
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Invalid');
    });
  });

  describe('validation failures', () => {
    it('should fail when role is not found', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const permission = createTestPermission('posts:create');
      permissionRepository.addPermission(permission);

      const command = new AssignPermissionToRoleCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        'posts:create',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Role not found');
    });

    it('should fail with invalid role ID format', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new AssignPermissionToRoleCommand(
        'invalid-role-id',
        'posts:create',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Invalid role ID');
    });

    it('should fail when permission is not found', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const role = createTestRole('editor');
      roleRepository.addRole(role);

      const command = new AssignPermissionToRoleCommand(
        role.id.toValue(),
        'nonexistent:permission',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('not found');
    });

    it('should fail when role already has the permission', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const role = createTestRole('editor');
      roleRepository.addRole(role);

      const permission = createTestPermission('posts:create');
      permissionRepository.addPermission(permission);

      // Simulate role already having the permission
      roleRepository.setPermissionsForRole(role.id.toValue(), ['posts:create']);

      const command = new AssignPermissionToRoleCommand(
        role.id.toValue(),
        'posts:create',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('already has permission');
    });
  });

  describe('command properties', () => {
    it('should correctly store command properties', () => {
      const command = new AssignPermissionToRoleCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        'users:read',
        '019123ab-cdef-7890-abcd-ef1234567891'
      );

      expect(command.roleId).toBe('019123ab-cdef-7890-abcd-ef1234567890');
      expect(command.permissionName).toBe('users:read');
      expect(command.assignedByUserId).toBe('019123ab-cdef-7890-abcd-ef1234567891');
    });
  });
});
