import { describe, it, expect, beforeEach } from 'vitest';
import { RemovePermissionFromRoleHandler } from '@auth/application/commands/remove-permission-from-role/RemovePermissionFromRoleHandler.ts';
import { RemovePermissionFromRoleCommand } from '@auth/application/commands/remove-permission-from-role/RemovePermissionFromRoleCommand.ts';
import {
  MockUserRepository,
  MockRoleRepository,
  MockPermissionRepository,
  createTestAdmin,
  createTestUser,
  createTestRole,
  createTestPermission,
} from '../../mocks/index.ts';

describe('RemovePermissionFromRoleHandler', () => {
  let handler: RemovePermissionFromRoleHandler;
  let userRepository: MockUserRepository;
  let roleRepository: MockRoleRepository;
  let permissionRepository: MockPermissionRepository;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    roleRepository = new MockRoleRepository();
    permissionRepository = new MockPermissionRepository();
    handler = new RemovePermissionFromRoleHandler(
      userRepository,
      roleRepository,
      permissionRepository
    );
  });

  describe('successful permission removal', () => {
    it('should remove a permission from a role when admin requests it', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const role = createTestRole('editor', 'Editor role', false);
      roleRepository.addRole(role);

      const permission = createTestPermission('posts:write');
      permissionRepository.addPermission(permission);

      // Assign permission to role first
      roleRepository.setPermissionsForRole(role.id.toValue(), [permission.name]);

      const command = new RemovePermissionFromRoleCommand(
        role.id.toValue(),
        permission.name,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
    });

    it('should normalize permission name to lowercase', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const role = createTestRole('editor', null, false);
      roleRepository.addRole(role);

      const permission = createTestPermission('posts:read');
      permissionRepository.addPermission(permission);
      roleRepository.setPermissionsForRole(role.id.toValue(), [permission.name]);

      const command = new RemovePermissionFromRoleCommand(
        role.id.toValue(),
        'POSTS:READ', // Uppercase
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
    });
  });

  describe('authorization failures', () => {
    it('should fail when remover is not an admin', async () => {
      const regularUser = createTestUser();
      userRepository.addUser(regularUser);

      const role = createTestRole('editor', null, false);
      roleRepository.addRole(role);

      const permission = createTestPermission('posts:write');
      permissionRepository.addPermission(permission);
      roleRepository.setPermissionsForRole(role.id.toValue(), [permission.name]);

      const command = new RemovePermissionFromRoleCommand(
        role.id.toValue(),
        permission.name,
        regularUser.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('administrators');
    });

    it('should fail when remover is not found', async () => {
      const role = createTestRole('editor', null, false);
      roleRepository.addRole(role);

      const permission = createTestPermission('posts:write');
      permissionRepository.addPermission(permission);

      const command = new RemovePermissionFromRoleCommand(
        role.id.toValue(),
        permission.name,
        '019123ab-cdef-7890-abcd-ef1234567890'
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Remover not found');
    });

    it('should fail with invalid remover user ID format', async () => {
      const command = new RemovePermissionFromRoleCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        'posts:read',
        'invalid-id'
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Invalid remover user ID');
    });
  });

  describe('validation failures', () => {
    it('should fail with invalid role ID format', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new RemovePermissionFromRoleCommand(
        'invalid-role-id',
        'posts:read',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Invalid role ID');
    });

    it('should fail when role is not found', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new RemovePermissionFromRoleCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        'posts:read',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Role not found');
    });

    it('should fail when permission is not found', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const role = createTestRole('editor', null, false);
      roleRepository.addRole(role);

      const command = new RemovePermissionFromRoleCommand(
        role.id.toValue(),
        'nonexistent:permission',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('not found');
    });

    it('should fail when role does not have the permission', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const role = createTestRole('editor', null, false);
      roleRepository.addRole(role);

      const permission = createTestPermission('posts:write');
      permissionRepository.addPermission(permission);
      // Note: Not assigning permission to role

      const command = new RemovePermissionFromRoleCommand(
        role.id.toValue(),
        permission.name,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('does not have permission');
    });
  });

  describe('command properties', () => {
    it('should correctly store command properties', () => {
      const command = new RemovePermissionFromRoleCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        'posts:write',
        '019123ab-cdef-7890-abcd-ef1234567891'
      );

      expect(command.roleId).toBe('019123ab-cdef-7890-abcd-ef1234567890');
      expect(command.permissionName).toBe('posts:write');
      expect(command.removedByUserId).toBe('019123ab-cdef-7890-abcd-ef1234567891');
    });
  });
});
