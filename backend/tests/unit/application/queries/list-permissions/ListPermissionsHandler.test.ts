import { describe, it, expect, beforeEach } from 'vitest';
import { ListPermissionsHandler } from '@auth/application/queries/list-permissions/ListPermissionsHandler.ts';
import { ListPermissionsQuery } from '@auth/application/queries/list-permissions/ListPermissionsQuery.ts';
import { MockPermissionRepository, createTestPermission } from '../../mocks/index.ts';

describe('ListPermissionsHandler', () => {
  let handler: ListPermissionsHandler;
  let permissionRepository: MockPermissionRepository;

  beforeEach(() => {
    permissionRepository = new MockPermissionRepository();
    handler = new ListPermissionsHandler(permissionRepository);
  });

  describe('pagination', () => {
    it('should return empty list when no permissions exist', async () => {
      const query = new ListPermissionsQuery(1, 10);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.permissions).toEqual([]);
      expect(data.total).toBe(0);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(10);
      expect(data.totalPages).toBe(0);
    });

    it('should return permissions with correct pagination', async () => {
      // Add 5 permissions
      for (let i = 1; i <= 5; i++) {
        permissionRepository.addPermission(
          createTestPermission(`resource${i}:action`, `Permission ${i}`)
        );
      }

      const query = new ListPermissionsQuery(1, 3);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.permissions.length).toBe(3);
      expect(data.total).toBe(5);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(3);
      expect(data.totalPages).toBe(2);
    });

    it('should return second page correctly', async () => {
      // Add 5 permissions
      for (let i = 1; i <= 5; i++) {
        permissionRepository.addPermission(
          createTestPermission(`resource${i}:action`, `Permission ${i}`)
        );
      }

      const query = new ListPermissionsQuery(2, 3);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.permissions.length).toBe(2); // Remaining 2 items
      expect(data.page).toBe(2);
    });

    it('should handle page beyond total pages', async () => {
      permissionRepository.addPermission(createTestPermission('users:read'));

      const query = new ListPermissionsQuery(100, 10);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.permissions).toEqual([]);
      expect(data.page).toBe(100);
    });

    it('should normalize invalid page to 1', async () => {
      permissionRepository.addPermission(createTestPermission('users:read'));

      const query = new ListPermissionsQuery(-5, 10);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.page).toBe(1);
    });

    it('should normalize invalid limit to 1', async () => {
      permissionRepository.addPermission(createTestPermission('users:read'));

      const query = new ListPermissionsQuery(1, -10);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.limit).toBe(1);
    });

    it('should cap limit at maximum of 100', async () => {
      permissionRepository.addPermission(createTestPermission('users:read'));

      const query = new ListPermissionsQuery(1, 500);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.limit).toBe(100);
    });
  });

  describe('filtering by resource', () => {
    it('should filter permissions by resource', async () => {
      permissionRepository.addPermission(createTestPermission('users:create'));
      permissionRepository.addPermission(createTestPermission('users:read'));
      permissionRepository.addPermission(createTestPermission('users:delete'));
      permissionRepository.addPermission(createTestPermission('roles:create'));
      permissionRepository.addPermission(createTestPermission('roles:read'));

      const query = new ListPermissionsQuery(1, 10, 'users');

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.permissions.length).toBe(3);
      expect(data.permissions.every((p) => p.resource === 'users')).toBe(true);
      expect(data.total).toBe(3);
    });

    it('should return empty list when resource has no permissions', async () => {
      permissionRepository.addPermission(createTestPermission('users:read'));

      const query = new ListPermissionsQuery(1, 10, 'nonexistent');

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.permissions).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('should paginate filtered results correctly', async () => {
      // Add 5 user permissions
      for (let i = 1; i <= 5; i++) {
        permissionRepository.addPermission(
          createTestPermission(`users:action${i}`)
        );
      }
      // Add some role permissions
      permissionRepository.addPermission(createTestPermission('roles:create'));
      permissionRepository.addPermission(createTestPermission('roles:delete'));

      const query = new ListPermissionsQuery(1, 2, 'users');

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.permissions.length).toBe(2);
      expect(data.total).toBe(5);
      expect(data.totalPages).toBe(3);
    });
  });

  describe('DTO mapping', () => {
    it('should map permission entity to DTO correctly', async () => {
      const permission = createTestPermission('reports:export', 'Export reports');
      permissionRepository.addPermission(permission);

      const query = new ListPermissionsQuery(1, 10);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const dto = result.getValue().permissions[0]!;
      expect(dto.id).toBe(permission.id.toValue());
      expect(dto.name).toBe('reports:export');
      expect(dto.resource).toBe('reports');
      expect(dto.action).toBe('export');
      expect(dto.description).toBe('Export reports');
      // createdAt is now returned as ISO string for response serialization
      expect(typeof dto.createdAt).toBe('string');
      expect(new Date(dto.createdAt).toISOString()).toBe(dto.createdAt);
    });

    it('should handle null description', async () => {
      const permission = createTestPermission('settings:read', null);
      permissionRepository.addPermission(permission);

      const query = new ListPermissionsQuery(1, 10);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const dto = result.getValue().permissions[0]!;
      expect(dto.description).toBeNull();
    });
  });

  describe('query properties', () => {
    it('should use default values when not specified', () => {
      const query = new ListPermissionsQuery();

      expect(query.page).toBe(1);
      expect(query.limit).toBe(10);
      expect(query.resource).toBeUndefined();
    });

    it('should accept custom values', () => {
      const query = new ListPermissionsQuery(5, 25, 'users');

      expect(query.page).toBe(5);
      expect(query.limit).toBe(25);
      expect(query.resource).toBe('users');
    });
  });
});
