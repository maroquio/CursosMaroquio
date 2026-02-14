import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { DrizzlePermissionRepository } from '../../src/contexts/auth/infrastructure/persistence/drizzle/DrizzlePermissionRepository.ts';
import { PermissionId } from '../../src/contexts/auth/domain/value-objects/PermissionId.ts';
import { UserId } from '../../src/contexts/auth/domain/value-objects/UserId.ts';
import { RoleId } from '../../src/contexts/auth/domain/value-objects/RoleId.ts';
import type { PermissionEntity } from '../../src/contexts/auth/domain/repositories/IPermissionRepository.ts';
import {
  initTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  createTestUser,
  createTestRole,
  createTestPermission,
  assignTestPermissionToRole,
  assignTestPermissionToUser,
} from './setup.ts';
import type { IDatabaseProvider } from '@shared/infrastructure/database/types.ts';

// Helper to generate IDs
const generatePermissionId = () => PermissionId.create();
const generateUserId = () => UserId.create();
const generateRoleId = () => RoleId.create();

/**
 * Integration Tests for DrizzlePermissionRepository
 * Tests actual database operations with PostgreSQL
 */
describe('DrizzlePermissionRepository Integration Tests', () => {
  let repository: DrizzlePermissionRepository;
  let dbProvider: IDatabaseProvider;

  beforeAll(async () => {
    const { provider } = await initTestDatabase();
    dbProvider = provider;
    repository = new DrizzlePermissionRepository(dbProvider);
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
    it('should save and retrieve a permission by id', async () => {
      const permissionId = generatePermissionId();
      const permission: PermissionEntity = {
        id: permissionId,
        name: 'posts:read',
        resource: 'posts',
        action: 'read',
        description: 'Read posts permission',
        createdAt: new Date(),
      };

      await repository.save(permission);
      const found = await repository.findById(permissionId);

      expect(found).not.toBeNull();
      expect(found!.id.toValue()).toBe(permissionId.toValue());
      expect(found!.name).toBe('posts:read');
      expect(found!.resource).toBe('posts');
      expect(found!.action).toBe('read');
      expect(found!.description).toBe('Read posts permission');
    });

    it('should return null for non-existent permission', async () => {
      const permissionId = generatePermissionId();
      const found = await repository.findById(permissionId);
      expect(found).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find permission by name (case insensitive)', async () => {
      const permissionId = generatePermissionId();
      await createTestPermission(
        permissionId.toValue(),
        'users:manage',
        'users',
        'manage',
        'Manage users'
      );

      const found = await repository.findByName('users:manage');
      expect(found).not.toBeNull();
      expect(found!.name).toBe('users:manage');
    });

    it('should return null for non-existent name', async () => {
      const found = await repository.findByName('nonexistent:permission');
      expect(found).toBeNull();
    });
  });

  describe('findByResource', () => {
    it('should find all permissions for a resource', async () => {
      // Create permissions for different resources
      await createTestPermission(
        generatePermissionId().toValue(),
        'posts:read',
        'posts',
        'read'
      );
      await createTestPermission(
        generatePermissionId().toValue(),
        'posts:write',
        'posts',
        'write'
      );
      await createTestPermission(
        generatePermissionId().toValue(),
        'users:read',
        'users',
        'read'
      );

      const postsPermissions = await repository.findByResource('posts');

      expect(postsPermissions).toHaveLength(2);
      expect(postsPermissions.every((p) => p.resource === 'posts')).toBe(true);
    });

    it('should return empty array for resource with no permissions', async () => {
      const permissions = await repository.findByResource('nonexistent');
      expect(permissions).toHaveLength(0);
    });
  });

  describe('findAll', () => {
    it('should return all permissions', async () => {
      await createTestPermission(
        generatePermissionId().toValue(),
        'perm1:action',
        'perm1',
        'action'
      );
      await createTestPermission(
        generatePermissionId().toValue(),
        'perm2:action',
        'perm2',
        'action'
      );

      const all = await repository.findAll();

      expect(all.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('findAllPaginated', () => {
    it('should return paginated permissions with correct metadata', async () => {
      // Create 5 permissions
      for (let i = 1; i <= 5; i++) {
        await createTestPermission(
          generatePermissionId().toValue(),
          `paginated${i}:action`,
          `paginated${i}`,
          'action'
        );
      }

      const page1 = await repository.findAllPaginated(1, 2);

      expect(page1.permissions.length).toBeLessThanOrEqual(2);
      expect(page1.page).toBe(1);
      expect(page1.limit).toBe(2);
      expect(page1.total).toBeGreaterThanOrEqual(5);
      expect(page1.totalPages).toBeGreaterThanOrEqual(3);
    });

    it('should return different results for different pages', async () => {
      for (let i = 1; i <= 4; i++) {
        await createTestPermission(
          generatePermissionId().toValue(),
          `paged${i}:action`,
          `paged${i}`,
          'action'
        );
      }

      const page1 = await repository.findAllPaginated(1, 2);
      const page2 = await repository.findAllPaginated(2, 2);

      // Pages should have different content
      const page1Ids = page1.permissions.map((p) => p.id.toValue());
      const page2Ids = page2.permissions.map((p) => p.id.toValue());

      // No overlap between pages
      const overlap = page1Ids.filter((id) => page2Ids.includes(id));
      expect(overlap).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update permission description', async () => {
      const permissionId = generatePermissionId();
      await createTestPermission(
        permissionId.toValue(),
        'update:test',
        'update',
        'test',
        'Original description'
      );

      const permission = await repository.findById(permissionId);
      expect(permission).not.toBeNull();

      permission!.description = 'Updated description';
      await repository.update(permission!);

      const updated = await repository.findById(permissionId);
      expect(updated!.description).toBe('Updated description');
    });
  });

  describe('delete', () => {
    it('should delete a permission', async () => {
      const permissionId = generatePermissionId();
      await createTestPermission(
        permissionId.toValue(),
        'delete:test',
        'delete',
        'test'
      );

      await repository.delete(permissionId);

      const found = await repository.findById(permissionId);
      expect(found).toBeNull();
    });
  });

  describe('existsByName', () => {
    it('should return true for existing permission', async () => {
      await createTestPermission(
        generatePermissionId().toValue(),
        'exists:test',
        'exists',
        'test'
      );

      const exists = await repository.existsByName('exists:test');
      expect(exists).toBe(true);
    });

    it('should return false for non-existing permission', async () => {
      const exists = await repository.existsByName('does:not:exist');
      expect(exists).toBe(false);
    });
  });

  // ===========================================================================
  // User-Permission Operations
  // ===========================================================================
  describe('findByUserId', () => {
    it('should find permissions assigned to a user', async () => {
      const userId = generateUserId();
      const permId1 = generatePermissionId();
      const permId2 = generatePermissionId();

      await createTestUser(userId.toValue(), 'user@test.com');
      await createTestPermission(permId1.toValue(), 'user:perm1', 'user', 'perm1');
      await createTestPermission(permId2.toValue(), 'user:perm2', 'user', 'perm2');
      await assignTestPermissionToUser(userId.toValue(), permId1.toValue());
      await assignTestPermissionToUser(userId.toValue(), permId2.toValue());

      const permissions = await repository.findByUserId(userId);

      expect(permissions).toHaveLength(2);
      const permNames = permissions.map((p) => p.getValue());
      expect(permNames).toContain('user:perm1');
      expect(permNames).toContain('user:perm2');
    });

    it('should return empty array for user with no permissions', async () => {
      const userId = generateUserId();
      await createTestUser(userId.toValue(), 'noperms@test.com');

      const permissions = await repository.findByUserId(userId);
      expect(permissions).toHaveLength(0);
    });
  });

  describe('assignToUser', () => {
    it('should assign permission to user', async () => {
      const userId = generateUserId();
      const permissionId = generatePermissionId();

      await createTestUser(userId.toValue(), 'assign@test.com');
      await createTestPermission(
        permissionId.toValue(),
        'assign:perm',
        'assign',
        'perm'
      );

      await repository.assignToUser(permissionId, userId);

      const permissions = await repository.findByUserId(userId);
      expect(permissions).toHaveLength(1);
      expect(permissions[0]!.getValue()).toBe('assign:perm');
    });

    it('should track who assigned the permission', async () => {
      const userId = generateUserId();
      const adminId = generateUserId();
      const permissionId = generatePermissionId();

      await createTestUser(userId.toValue(), 'target@test.com');
      await createTestUser(adminId.toValue(), 'admin@test.com');
      await createTestPermission(
        permissionId.toValue(),
        'tracked:perm',
        'tracked',
        'perm'
      );

      await repository.assignToUser(permissionId, userId, adminId);

      const permissions = await repository.findByUserId(userId);
      expect(permissions).toHaveLength(1);
    });

    it('should not duplicate assignment (idempotent)', async () => {
      const userId = generateUserId();
      const permissionId = generatePermissionId();

      await createTestUser(userId.toValue(), 'idempotent@test.com');
      await createTestPermission(
        permissionId.toValue(),
        'idem:perm',
        'idem',
        'perm'
      );

      await repository.assignToUser(permissionId, userId);
      await repository.assignToUser(permissionId, userId);

      const permissions = await repository.findByUserId(userId);
      expect(permissions).toHaveLength(1);
    });
  });

  describe('removeFromUser', () => {
    it('should remove permission from user', async () => {
      const userId = generateUserId();
      const permissionId = generatePermissionId();

      await createTestUser(userId.toValue(), 'remove@test.com');
      await createTestPermission(
        permissionId.toValue(),
        'remove:perm',
        'remove',
        'perm'
      );
      await assignTestPermissionToUser(userId.toValue(), permissionId.toValue());

      await repository.removeFromUser(permissionId, userId);

      const permissions = await repository.findByUserId(userId);
      expect(permissions).toHaveLength(0);
    });
  });

  describe('userHasPermission', () => {
    it('should return true when user has permission', async () => {
      const userId = generateUserId();
      const permissionId = generatePermissionId();

      await createTestUser(userId.toValue(), 'hasperm@test.com');
      await createTestPermission(
        permissionId.toValue(),
        'check:perm',
        'check',
        'perm'
      );
      await assignTestPermissionToUser(userId.toValue(), permissionId.toValue());

      const hasPerm = await repository.userHasPermission(userId, 'check:perm');
      expect(hasPerm).toBe(true);
    });

    it('should return false when user does not have permission', async () => {
      const userId = generateUserId();
      await createTestUser(userId.toValue(), 'noperm@test.com');

      const hasPerm = await repository.userHasPermission(userId, 'nonexistent:perm');
      expect(hasPerm).toBe(false);
    });
  });

  describe('setUserPermissions', () => {
    it('should replace all user permissions atomically', async () => {
      const userId = generateUserId();
      const perm1 = generatePermissionId();
      const perm2 = generatePermissionId();
      const perm3 = generatePermissionId();

      await createTestUser(userId.toValue(), 'setperms@test.com');
      await createTestPermission(perm1.toValue(), 'set:perm1', 'set', 'perm1');
      await createTestPermission(perm2.toValue(), 'set:perm2', 'set', 'perm2');
      await createTestPermission(perm3.toValue(), 'set:perm3', 'set', 'perm3');

      // Initially assign perm1 and perm2
      await assignTestPermissionToUser(userId.toValue(), perm1.toValue());
      await assignTestPermissionToUser(userId.toValue(), perm2.toValue());

      // Replace with perm2 and perm3
      await repository.setUserPermissions(userId, [perm2, perm3]);

      const permissions = await repository.findByUserId(userId);
      expect(permissions).toHaveLength(2);
      const permNames = permissions.map((p) => p.getValue());
      expect(permNames).not.toContain('set:perm1');
      expect(permNames).toContain('set:perm2');
      expect(permNames).toContain('set:perm3');
    });

    it('should clear all permissions when given empty array', async () => {
      const userId = generateUserId();
      const permissionId = generatePermissionId();

      await createTestUser(userId.toValue(), 'clearperms@test.com');
      await createTestPermission(
        permissionId.toValue(),
        'clear:perm',
        'clear',
        'perm'
      );
      await assignTestPermissionToUser(userId.toValue(), permissionId.toValue());

      await repository.setUserPermissions(userId, []);

      const permissions = await repository.findByUserId(userId);
      expect(permissions).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Role-Permission Queries
  // ===========================================================================
  describe('findByRoleId', () => {
    it('should find permissions assigned to a role', async () => {
      const roleId = generateRoleId();
      const perm1 = generatePermissionId();
      const perm2 = generatePermissionId();

      await createTestRole(roleId.toValue(), 'testrole');
      await createTestPermission(perm1.toValue(), 'role:perm1', 'role', 'perm1');
      await createTestPermission(perm2.toValue(), 'role:perm2', 'role', 'perm2');
      await assignTestPermissionToRole(roleId.toValue(), perm1.toValue());
      await assignTestPermissionToRole(roleId.toValue(), perm2.toValue());

      const permissions = await repository.findByRoleId(roleId);

      expect(permissions).toHaveLength(2);
      const permNames = permissions.map((p) => p.getValue());
      expect(permNames).toContain('role:perm1');
      expect(permNames).toContain('role:perm2');
    });
  });

  // ===========================================================================
  // Bulk Operations
  // ===========================================================================
  describe('findByIds', () => {
    it('should find multiple permissions by ids', async () => {
      const id1 = generatePermissionId();
      const id2 = generatePermissionId();
      const id3 = generatePermissionId();

      await createTestPermission(id1.toValue(), 'bulk:perm1', 'bulk', 'perm1');
      await createTestPermission(id2.toValue(), 'bulk:perm2', 'bulk', 'perm2');
      await createTestPermission(id3.toValue(), 'bulk:perm3', 'bulk', 'perm3');

      const permissions = await repository.findByIds([id1, id3]);

      expect(permissions).toHaveLength(2);
      const names = permissions.map((p) => p.name);
      expect(names).toContain('bulk:perm1');
      expect(names).toContain('bulk:perm3');
    });

    it('should return empty array for empty input', async () => {
      const permissions = await repository.findByIds([]);
      expect(permissions).toHaveLength(0);
    });
  });

  describe('findByNames', () => {
    it('should find multiple permissions by names', async () => {
      await createTestPermission(
        generatePermissionId().toValue(),
        'named:perm1',
        'named',
        'perm1'
      );
      await createTestPermission(
        generatePermissionId().toValue(),
        'named:perm2',
        'named',
        'perm2'
      );
      await createTestPermission(
        generatePermissionId().toValue(),
        'named:perm3',
        'named',
        'perm3'
      );

      const permissions = await repository.findByNames(['named:perm1', 'named:perm3']);

      expect(permissions).toHaveLength(2);
    });

    it('should return empty array for empty input', async () => {
      const permissions = await repository.findByNames([]);
      expect(permissions).toHaveLength(0);
    });
  });
});
