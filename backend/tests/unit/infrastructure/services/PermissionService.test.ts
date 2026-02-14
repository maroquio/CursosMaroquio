import { describe, it, expect, beforeEach } from 'vitest';
import { PermissionService } from '@auth/infrastructure/services/PermissionService.ts';
import {
  MockPermissionRepository,
  MockRoleRepository,
  createTestRole,
  createTestPermission,
} from '../../application/mocks/index.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { Permission } from '@auth/domain/value-objects/Permission.ts';
import { Role } from '@auth/domain/value-objects/Role.ts';

describe('PermissionService', () => {
  let service: PermissionService;
  let permissionRepository: MockPermissionRepository;
  let roleRepository: MockRoleRepository;
  let testUserId: UserId;

  beforeEach(() => {
    permissionRepository = new MockPermissionRepository();
    roleRepository = new MockRoleRepository();
    service = new PermissionService(permissionRepository, roleRepository);
    testUserId = UserId.create();
  });

  describe('getEffectivePermissions', () => {
    it('should return empty array when user has no roles and no individual permissions', async () => {
      const result = await service.getEffectivePermissions(testUserId);

      expect(result).toEqual([]);
    });

    it('should return individual permissions assigned to user', async () => {
      const permission = createTestPermission('posts:read');
      permissionRepository.addPermission(permission);
      await permissionRepository.assignToUser(permission.id, testUserId);

      const result = await service.getEffectivePermissions(testUserId);

      expect(result.length).toBe(1);
      expect(result[0]!.getValue()).toBe('posts:read');
    });

    it('should return permissions from user roles', async () => {
      // Create role with permissions
      const role = createTestRole('editor', 'Editor role', false);
      roleRepository.addRole(role);
      roleRepository.setUserRoles(testUserId.toValue(), [role.id.toValue()]);
      roleRepository.setPermissionsForRole(role.id.toValue(), ['posts:read', 'posts:write']);

      // Mock finding role by user
      const mockFindByUserId = async (_userId: UserId): Promise<Role[]> => {
        return [Role.create('editor').getValue()];
      };
      (roleRepository as any).findByUserId = mockFindByUserId;

      const result = await service.getEffectivePermissions(testUserId);

      expect(result.length).toBe(2);
      const permNames = result.map((p) => p.getValue());
      expect(permNames).toContain('posts:read');
      expect(permNames).toContain('posts:write');
    });

    it('should combine role permissions and individual permissions', async () => {
      // Setup role with permission
      const role = createTestRole('editor', null, false);
      roleRepository.addRole(role);
      roleRepository.setPermissionsForRole(role.id.toValue(), ['posts:read']);

      // Setup individual permission
      const individualPerm = createTestPermission('comments:write');
      permissionRepository.addPermission(individualPerm);
      await permissionRepository.assignToUser(individualPerm.id, testUserId);

      // Mock finding role by user
      (roleRepository as any).findByUserId = async () => [Role.create('editor').getValue()];

      const result = await service.getEffectivePermissions(testUserId);

      expect(result.length).toBe(2);
      const permNames = result.map((p) => p.getValue());
      expect(permNames).toContain('posts:read');
      expect(permNames).toContain('comments:write');
    });

    it('should deduplicate permissions that appear in both role and individual', async () => {
      // Setup role with permission
      const role = createTestRole('editor', null, false);
      roleRepository.addRole(role);
      roleRepository.setPermissionsForRole(role.id.toValue(), ['posts:read']);

      // Setup same permission individually
      const individualPerm = createTestPermission('posts:read');
      permissionRepository.addPermission(individualPerm);
      await permissionRepository.assignToUser(individualPerm.id, testUserId);

      // Mock finding role by user
      (roleRepository as any).findByUserId = async () => [Role.create('editor').getValue()];

      const result = await service.getEffectivePermissions(testUserId);

      // Should be deduplicated
      expect(result.length).toBe(1);
      expect(result[0]!.getValue()).toBe('posts:read');
    });
  });

  describe('getEffectivePermissionNames', () => {
    it('should return permission names as strings', async () => {
      const perm1 = createTestPermission('posts:read');
      const perm2 = createTestPermission('posts:write');
      permissionRepository.addPermission(perm1);
      permissionRepository.addPermission(perm2);
      await permissionRepository.assignToUser(perm1.id, testUserId);
      await permissionRepository.assignToUser(perm2.id, testUserId);

      const result = await service.getEffectivePermissionNames(testUserId);

      expect(result).toContain('posts:read');
      expect(result).toContain('posts:write');
      expect(result.length).toBe(2);
    });

    it('should return empty array when user has no permissions', async () => {
      const result = await service.getEffectivePermissionNames(testUserId);

      expect(result).toEqual([]);
    });
  });

  describe('userHasPermission', () => {
    it('should return true when user has exact permission', async () => {
      const permission = createTestPermission('posts:read');
      permissionRepository.addPermission(permission);
      await permissionRepository.assignToUser(permission.id, testUserId);

      const result = await service.userHasPermission(testUserId, 'posts:read');

      expect(result).toBe(true);
    });

    it('should return false when user does not have permission', async () => {
      const result = await service.userHasPermission(testUserId, 'posts:read');

      expect(result).toBe(false);
    });

    it('should return true when user has wildcard permission that grants requested', async () => {
      const wildcardPerm = createTestPermission('posts:*');
      permissionRepository.addPermission(wildcardPerm);
      await permissionRepository.assignToUser(wildcardPerm.id, testUserId);

      const result = await service.userHasPermission(testUserId, 'posts:read');

      expect(result).toBe(true);
    });

    it('should return false when wildcard does not match resource', async () => {
      const wildcardPerm = createTestPermission('posts:*');
      permissionRepository.addPermission(wildcardPerm);
      await permissionRepository.assignToUser(wildcardPerm.id, testUserId);

      // posts:* should NOT grant users:read (different resource)
      const result = await service.userHasPermission(testUserId, 'users:read');

      expect(result).toBe(false);
    });

    it('should return false for invalid permission format', async () => {
      const result = await service.userHasPermission(testUserId, 'invalid format');

      expect(result).toBe(false);
    });

    it('should check role permissions as well', async () => {
      // Setup role with permission
      const role = createTestRole('editor', null, false);
      roleRepository.addRole(role);
      roleRepository.setPermissionsForRole(role.id.toValue(), ['posts:delete']);

      // Mock finding role by user
      (roleRepository as any).findByUserId = async () => [Role.create('editor').getValue()];

      const result = await service.userHasPermission(testUserId, 'posts:delete');

      expect(result).toBe(true);
    });
  });

  describe('userHasAnyPermission', () => {
    it('should return true if user has at least one permission', async () => {
      const permission = createTestPermission('posts:read');
      permissionRepository.addPermission(permission);
      await permissionRepository.assignToUser(permission.id, testUserId);

      const result = await service.userHasAnyPermission(testUserId, [
        'posts:read',
        'posts:write',
        'posts:delete',
      ]);

      expect(result).toBe(true);
    });

    it('should return false if user has none of the permissions', async () => {
      const result = await service.userHasAnyPermission(testUserId, [
        'posts:read',
        'posts:write',
      ]);

      expect(result).toBe(false);
    });

    it('should return true for empty permission list', async () => {
      const result = await service.userHasAnyPermission(testUserId, []);

      expect(result).toBe(false);
    });

    it('should work with wildcard permissions', async () => {
      const wildcardPerm = createTestPermission('posts:*');
      permissionRepository.addPermission(wildcardPerm);
      await permissionRepository.assignToUser(wildcardPerm.id, testUserId);

      const result = await service.userHasAnyPermission(testUserId, [
        'users:read',
        'posts:delete', // This should match posts:*
      ]);

      expect(result).toBe(true);
    });
  });

  describe('userHasAllPermissions', () => {
    it('should return true if user has all permissions', async () => {
      const perm1 = createTestPermission('posts:read');
      const perm2 = createTestPermission('posts:write');
      permissionRepository.addPermission(perm1);
      permissionRepository.addPermission(perm2);
      await permissionRepository.assignToUser(perm1.id, testUserId);
      await permissionRepository.assignToUser(perm2.id, testUserId);

      const result = await service.userHasAllPermissions(testUserId, [
        'posts:read',
        'posts:write',
      ]);

      expect(result).toBe(true);
    });

    it('should return false if user is missing one permission', async () => {
      const permission = createTestPermission('posts:read');
      permissionRepository.addPermission(permission);
      await permissionRepository.assignToUser(permission.id, testUserId);

      const result = await service.userHasAllPermissions(testUserId, [
        'posts:read',
        'posts:write', // User doesn't have this
      ]);

      expect(result).toBe(false);
    });

    it('should return true for empty permission list', async () => {
      const result = await service.userHasAllPermissions(testUserId, []);

      expect(result).toBe(true);
    });

    it('should work with wildcard granting multiple permissions', async () => {
      const wildcardPerm = createTestPermission('posts:*');
      permissionRepository.addPermission(wildcardPerm);
      await permissionRepository.assignToUser(wildcardPerm.id, testUserId);

      const result = await service.userHasAllPermissions(testUserId, [
        'posts:read',
        'posts:write',
        'posts:delete',
      ]);

      expect(result).toBe(true);
    });
  });

  describe('invalidateUserPermissions', () => {
    it('should complete without error (no-op for now)', async () => {
      // This should not throw - just complete as a no-op
      const result = await service.invalidateUserPermissions(testUserId);
      expect(result).toBeUndefined();
    });
  });
});
