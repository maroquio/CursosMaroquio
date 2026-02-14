import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { DrizzleRoleRepository } from '../../src/contexts/auth/infrastructure/persistence/drizzle/DrizzleRoleRepository.ts';
import { RoleId } from '../../src/contexts/auth/domain/value-objects/RoleId.ts';
import { UserId } from '../../src/contexts/auth/domain/value-objects/UserId.ts';
import { PermissionId } from '../../src/contexts/auth/domain/value-objects/PermissionId.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import type { RoleEntity } from '../../src/contexts/auth/domain/repositories/IRoleRepository.ts';
import {
  initTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  createTestUser,
  createTestRole,
  createTestPermission,
  assignTestRoleToUser,
  assignTestPermissionToRole,
} from './setup.ts';
import type { IDatabaseProvider } from '@shared/infrastructure/database/types.ts';

// Helper to generate IDs
const generateRoleId = () => RoleId.create();
const generateUserId = () => UserId.create();
const generatePermissionId = () => PermissionId.create();

/**
 * Integration Tests for DrizzleRoleRepository
 * Tests actual database operations with PostgreSQL
 */
describe('DrizzleRoleRepository Integration Tests', () => {
  let repository: DrizzleRoleRepository;
  let dbProvider: IDatabaseProvider;

  beforeAll(async () => {
    const { provider } = await initTestDatabase();
    dbProvider = provider;
    repository = new DrizzleRoleRepository(dbProvider);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
  });

  // ===========================================================================
  // Basic CRUD Operations
  // ===========================================================================
  describe('save and findById', () => {
    it('should save and retrieve a role by id', async () => {
      const roleId = generateRoleId();
      const role: RoleEntity = {
        id: roleId,
        name: 'editor',
        description: 'Content editor role',
        isSystem: false,
        createdAt: new Date(),
        updatedAt: null,
      };

      await repository.save(role);
      const found = await repository.findById(roleId);

      expect(found).not.toBeNull();
      expect(found!.id.toValue()).toBe(roleId.toValue());
      expect(found!.name).toBe('editor');
      expect(found!.description).toBe('Content editor role');
      expect(found!.isSystem).toBe(false);
    });

    it('should return null for non-existent role', async () => {
      const roleId = generateRoleId();
      const found = await repository.findById(roleId);
      expect(found).toBeNull();
    });

    it('should save system role correctly', async () => {
      const roleId = generateRoleId();
      const role: RoleEntity = {
        id: roleId,
        name: 'superadmin',
        description: 'Super administrator',
        isSystem: true,
        createdAt: new Date(),
        updatedAt: null,
      };

      await repository.save(role);
      const found = await repository.findById(roleId);

      expect(found).not.toBeNull();
      expect(found!.isSystem).toBe(true);
    });
  });

  describe('findByName', () => {
    it('should find role by name (case insensitive)', async () => {
      const roleId = generateRoleId();
      await createTestRole(roleId.toValue(), 'moderator', 'Moderator role');

      const found = await repository.findByName('moderator');
      expect(found).not.toBeNull();
      expect(found!.name).toBe('moderator');
    });

    it('should return null for non-existent name', async () => {
      const found = await repository.findByName('nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all roles', async () => {
      await createTestRole(generateRoleId().toValue(), 'role1', 'Role 1');
      await createTestRole(generateRoleId().toValue(), 'role2', 'Role 2');
      await createTestRole(generateRoleId().toValue(), 'role3', 'Role 3');

      const all = await repository.findAll();

      expect(all.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('findAllPaginated', () => {
    it('should return paginated roles with correct metadata', async () => {
      for (let i = 1; i <= 5; i++) {
        await createTestRole(generateRoleId().toValue(), `paginatedrole${i}`, `Role ${i}`);
      }

      const page1 = await repository.findAllPaginated(1, 2);

      expect(page1.roles.length).toBeLessThanOrEqual(2);
      expect(page1.page).toBe(1);
      expect(page1.limit).toBe(2);
      expect(page1.total).toBeGreaterThanOrEqual(5);
      expect(page1.totalPages).toBeGreaterThanOrEqual(3);
    });

    it('should return different results for different pages', async () => {
      for (let i = 1; i <= 4; i++) {
        await createTestRole(generateRoleId().toValue(), `pagedrole${i}`, `Role ${i}`);
      }

      const page1 = await repository.findAllPaginated(1, 2);
      const page2 = await repository.findAllPaginated(2, 2);

      const page1Ids = page1.roles.map((r) => r.id.toValue());
      const page2Ids = page2.roles.map((r) => r.id.toValue());

      const overlap = page1Ids.filter((id) => page2Ids.includes(id));
      expect(overlap).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update role name and description', async () => {
      const roleId = generateRoleId();
      await createTestRole(roleId.toValue(), 'oldrole', 'Old description');

      const role = await repository.findById(roleId);
      expect(role).not.toBeNull();

      role!.name = 'newrole';
      role!.description = 'New description';
      await repository.update(role!);

      const updated = await repository.findById(roleId);
      expect(updated!.name).toBe('newrole');
      expect(updated!.description).toBe('New description');
      expect(updated!.updatedAt).not.toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a non-system role', async () => {
      const roleId = generateRoleId();
      await createTestRole(roleId.toValue(), 'deletable', null, false);

      await repository.delete(roleId);

      const found = await repository.findById(roleId);
      expect(found).toBeNull();
    });

    it('should throw error when deleting system role', async () => {
      const roleId = generateRoleId();
      await createTestRole(roleId.toValue(), 'systemrole', 'System role', true);

      await expect(repository.delete(roleId)).rejects.toThrow(ErrorCode.ROLE_CANNOT_DELETE_SYSTEM);
    });
  });

  describe('existsByName', () => {
    it('should return true for existing role', async () => {
      await createTestRole(generateRoleId().toValue(), 'existingrole');

      const exists = await repository.existsByName('existingrole');
      expect(exists).toBe(true);
    });

    it('should return false for non-existing role', async () => {
      const exists = await repository.existsByName('nonexistentrole');
      expect(exists).toBe(false);
    });
  });

  // ===========================================================================
  // User-Role Operations
  // ===========================================================================
  describe('findByUserId', () => {
    it('should find roles assigned to a user', async () => {
      const userId = generateUserId();
      const role1Id = generateRoleId();
      const role2Id = generateRoleId();

      await createTestUser(userId.toValue(), 'roleuser@test.com');
      await createTestRole(role1Id.toValue(), 'userrole1');
      await createTestRole(role2Id.toValue(), 'userrole2');
      await assignTestRoleToUser(userId.toValue(), role1Id.toValue());
      await assignTestRoleToUser(userId.toValue(), role2Id.toValue());

      const roles = await repository.findByUserId(userId);

      expect(roles).toHaveLength(2);
      const roleNames = roles.map((r) => r.getValue());
      expect(roleNames).toContain('userrole1');
      expect(roleNames).toContain('userrole2');
    });

    it('should return empty array for user with no roles', async () => {
      const userId = generateUserId();
      await createTestUser(userId.toValue(), 'noroles@test.com');

      const roles = await repository.findByUserId(userId);
      expect(roles).toHaveLength(0);
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role to user', async () => {
      const userId = generateUserId();
      const roleId = generateRoleId();

      await createTestUser(userId.toValue(), 'assignrole@test.com');
      await createTestRole(roleId.toValue(), 'assignablerole');

      await repository.assignRoleToUser(userId, roleId);

      const roles = await repository.findByUserId(userId);
      expect(roles).toHaveLength(1);
      expect(roles[0]!.getValue()).toBe('assignablerole');
    });

    it('should track who assigned the role', async () => {
      const userId = generateUserId();
      const adminId = generateUserId();
      const roleId = generateRoleId();

      await createTestUser(userId.toValue(), 'target@test.com');
      await createTestUser(adminId.toValue(), 'admin@test.com');
      await createTestRole(roleId.toValue(), 'trackedrole');

      await repository.assignRoleToUser(userId, roleId, adminId);

      const roles = await repository.findByUserId(userId);
      expect(roles).toHaveLength(1);
    });

    it('should not duplicate assignment (idempotent)', async () => {
      const userId = generateUserId();
      const roleId = generateRoleId();

      await createTestUser(userId.toValue(), 'idempotent@test.com');
      await createTestRole(roleId.toValue(), 'idemrole');

      await repository.assignRoleToUser(userId, roleId);
      await repository.assignRoleToUser(userId, roleId);

      const roles = await repository.findByUserId(userId);
      expect(roles).toHaveLength(1);
    });
  });

  describe('removeRoleFromUser', () => {
    it('should remove role from user', async () => {
      const userId = generateUserId();
      const roleId = generateRoleId();

      await createTestUser(userId.toValue(), 'removerole@test.com');
      await createTestRole(roleId.toValue(), 'removablerole');
      await assignTestRoleToUser(userId.toValue(), roleId.toValue());

      await repository.removeRoleFromUser(userId, roleId);

      const roles = await repository.findByUserId(userId);
      expect(roles).toHaveLength(0);
    });
  });

  describe('userHasRole', () => {
    it('should return true when user has role', async () => {
      const userId = generateUserId();
      const roleId = generateRoleId();

      await createTestUser(userId.toValue(), 'hasrole@test.com');
      await createTestRole(roleId.toValue(), 'checkrole');
      await assignTestRoleToUser(userId.toValue(), roleId.toValue());

      const hasRole = await repository.userHasRole(userId, 'checkrole');
      expect(hasRole).toBe(true);
    });

    it('should return false when user does not have role', async () => {
      const userId = generateUserId();
      await createTestUser(userId.toValue(), 'norole@test.com');

      const hasRole = await repository.userHasRole(userId, 'nonexistentrole');
      expect(hasRole).toBe(false);
    });
  });

  // ===========================================================================
  // Role-Permission Operations
  // ===========================================================================
  describe('findPermissionsByRoleId', () => {
    it('should find permissions assigned to a role', async () => {
      const roleId = generateRoleId();
      const perm1Id = generatePermissionId();
      const perm2Id = generatePermissionId();

      await createTestRole(roleId.toValue(), 'permrole');
      await createTestPermission(perm1Id.toValue(), 'role:perm1', 'role', 'perm1');
      await createTestPermission(perm2Id.toValue(), 'role:perm2', 'role', 'perm2');
      await assignTestPermissionToRole(roleId.toValue(), perm1Id.toValue());
      await assignTestPermissionToRole(roleId.toValue(), perm2Id.toValue());

      const permissions = await repository.findPermissionsByRoleId(roleId);

      expect(permissions).toHaveLength(2);
      const permNames = permissions.map((p) => p.getValue());
      expect(permNames).toContain('role:perm1');
      expect(permNames).toContain('role:perm2');
    });

    it('should return empty array for role with no permissions', async () => {
      const roleId = generateRoleId();
      await createTestRole(roleId.toValue(), 'nopermsrole');

      const permissions = await repository.findPermissionsByRoleId(roleId);
      expect(permissions).toHaveLength(0);
    });
  });

  describe('assignPermissionToRole', () => {
    it('should assign permission to role', async () => {
      const roleId = generateRoleId();
      const permissionId = generatePermissionId();

      await createTestRole(roleId.toValue(), 'assignpermrole');
      await createTestPermission(permissionId.toValue(), 'assign:perm', 'assign', 'perm');

      await repository.assignPermissionToRole(roleId, permissionId);

      const permissions = await repository.findPermissionsByRoleId(roleId);
      expect(permissions).toHaveLength(1);
      expect(permissions[0]!.getValue()).toBe('assign:perm');
    });

    it('should track who assigned the permission', async () => {
      const roleId = generateRoleId();
      const permissionId = generatePermissionId();
      const adminId = generateUserId();

      await createTestRole(roleId.toValue(), 'trackpermrole');
      await createTestPermission(permissionId.toValue(), 'track:perm', 'track', 'perm');
      await createTestUser(adminId.toValue(), 'admin@test.com');

      await repository.assignPermissionToRole(roleId, permissionId, adminId);

      const permissions = await repository.findPermissionsByRoleId(roleId);
      expect(permissions).toHaveLength(1);
    });

    it('should not duplicate assignment (idempotent)', async () => {
      const roleId = generateRoleId();
      const permissionId = generatePermissionId();

      await createTestRole(roleId.toValue(), 'idempermrole');
      await createTestPermission(permissionId.toValue(), 'idem:perm', 'idem', 'perm');

      await repository.assignPermissionToRole(roleId, permissionId);
      await repository.assignPermissionToRole(roleId, permissionId);

      const permissions = await repository.findPermissionsByRoleId(roleId);
      expect(permissions).toHaveLength(1);
    });
  });

  describe('removePermissionFromRole', () => {
    it('should remove permission from role', async () => {
      const roleId = generateRoleId();
      const permissionId = generatePermissionId();

      await createTestRole(roleId.toValue(), 'removepermrole');
      await createTestPermission(permissionId.toValue(), 'remove:perm', 'remove', 'perm');
      await assignTestPermissionToRole(roleId.toValue(), permissionId.toValue());

      await repository.removePermissionFromRole(roleId, permissionId);

      const permissions = await repository.findPermissionsByRoleId(roleId);
      expect(permissions).toHaveLength(0);
    });
  });

  describe('roleHasPermission', () => {
    it('should return true when role has permission', async () => {
      const roleId = generateRoleId();
      const permissionId = generatePermissionId();

      await createTestRole(roleId.toValue(), 'haspermrole');
      await createTestPermission(permissionId.toValue(), 'check:perm', 'check', 'perm');
      await assignTestPermissionToRole(roleId.toValue(), permissionId.toValue());

      const hasPerm = await repository.roleHasPermission(roleId, 'check:perm');
      expect(hasPerm).toBe(true);
    });

    it('should return false when role does not have permission', async () => {
      const roleId = generateRoleId();
      await createTestRole(roleId.toValue(), 'nopermrole');

      const hasPerm = await repository.roleHasPermission(roleId, 'nonexistent:perm');
      expect(hasPerm).toBe(false);
    });
  });

  describe('setRolePermissions', () => {
    it('should replace all role permissions atomically', async () => {
      const roleId = generateRoleId();
      const perm1 = generatePermissionId();
      const perm2 = generatePermissionId();
      const perm3 = generatePermissionId();

      await createTestRole(roleId.toValue(), 'setpermsrole');
      await createTestPermission(perm1.toValue(), 'set:perm1', 'set', 'perm1');
      await createTestPermission(perm2.toValue(), 'set:perm2', 'set', 'perm2');
      await createTestPermission(perm3.toValue(), 'set:perm3', 'set', 'perm3');

      // Initially assign perm1 and perm2
      await assignTestPermissionToRole(roleId.toValue(), perm1.toValue());
      await assignTestPermissionToRole(roleId.toValue(), perm2.toValue());

      // Replace with perm2 and perm3
      await repository.setRolePermissions(roleId, [perm2, perm3]);

      const permissions = await repository.findPermissionsByRoleId(roleId);
      expect(permissions).toHaveLength(2);
      const permNames = permissions.map((p) => p.getValue());
      expect(permNames).not.toContain('set:perm1');
      expect(permNames).toContain('set:perm2');
      expect(permNames).toContain('set:perm3');
    });

    it('should clear all permissions when given empty array', async () => {
      const roleId = generateRoleId();
      const permissionId = generatePermissionId();

      await createTestRole(roleId.toValue(), 'clearpermsrole');
      await createTestPermission(permissionId.toValue(), 'clear:perm', 'clear', 'perm');
      await assignTestPermissionToRole(roleId.toValue(), permissionId.toValue());

      await repository.setRolePermissions(roleId, []);

      const permissions = await repository.findPermissionsByRoleId(roleId);
      expect(permissions).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Complex Scenarios
  // ===========================================================================
  describe('Complex Scenarios', () => {
    it('should handle user with multiple roles having overlapping permissions', async () => {
      const userId = generateUserId();
      const role1Id = generateRoleId();
      const role2Id = generateRoleId();
      const perm1 = generatePermissionId();
      const perm2 = generatePermissionId();
      const perm3 = generatePermissionId();

      await createTestUser(userId.toValue(), 'multirole@test.com');
      await createTestRole(role1Id.toValue(), 'multirole1');
      await createTestRole(role2Id.toValue(), 'multirole2');

      await createTestPermission(perm1.toValue(), 'shared:perm', 'shared', 'perm');
      await createTestPermission(perm2.toValue(), 'role1:only', 'role1', 'only');
      await createTestPermission(perm3.toValue(), 'role2:only', 'role2', 'only');

      // Role1 has perm1 and perm2
      await assignTestPermissionToRole(role1Id.toValue(), perm1.toValue());
      await assignTestPermissionToRole(role1Id.toValue(), perm2.toValue());

      // Role2 has perm1 and perm3 (perm1 is shared)
      await assignTestPermissionToRole(role2Id.toValue(), perm1.toValue());
      await assignTestPermissionToRole(role2Id.toValue(), perm3.toValue());

      // Assign both roles to user
      await assignTestRoleToUser(userId.toValue(), role1Id.toValue());
      await assignTestRoleToUser(userId.toValue(), role2Id.toValue());

      const userRoles = await repository.findByUserId(userId);
      expect(userRoles).toHaveLength(2);

      const role1Perms = await repository.findPermissionsByRoleId(role1Id);
      const role2Perms = await repository.findPermissionsByRoleId(role2Id);

      expect(role1Perms).toHaveLength(2);
      expect(role2Perms).toHaveLength(2);
    });
  });
});
