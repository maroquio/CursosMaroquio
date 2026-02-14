import { describe, it, expect, beforeEach } from 'vitest';
import { ListRolesHandler } from '@auth/application/queries/list-roles/ListRolesHandler.ts';
import { ListRolesQuery } from '@auth/application/queries/list-roles/ListRolesQuery.ts';
import { MockRoleRepository, createTestRole } from '../../mocks/index.ts';

describe('ListRolesHandler', () => {
  let handler: ListRolesHandler;
  let roleRepository: MockRoleRepository;

  beforeEach(() => {
    roleRepository = new MockRoleRepository();
    handler = new ListRolesHandler(roleRepository);
  });

  describe('pagination', () => {
    it('should return empty list when no roles exist', async () => {
      const query = new ListRolesQuery(1, 10);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.roles).toEqual([]);
      expect(data.total).toBe(0);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(10);
      expect(data.totalPages).toBe(0);
    });

    it('should return roles with correct pagination', async () => {
      // Add 5 roles
      for (let i = 1; i <= 5; i++) {
        roleRepository.addRole(createTestRole(`role${i}`, `Role ${i}`));
      }

      const query = new ListRolesQuery(1, 3);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.roles.length).toBe(3);
      expect(data.total).toBe(5);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(3);
      expect(data.totalPages).toBe(2);
    });

    it('should return second page correctly', async () => {
      // Add 5 roles
      for (let i = 1; i <= 5; i++) {
        roleRepository.addRole(createTestRole(`role${i}`, `Role ${i}`));
      }

      const query = new ListRolesQuery(2, 3);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.roles.length).toBe(2); // Remaining 2 items
      expect(data.page).toBe(2);
    });

    it('should handle page beyond total pages', async () => {
      roleRepository.addRole(createTestRole('admin', 'Admin role'));

      const query = new ListRolesQuery(100, 10);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.roles).toEqual([]);
      expect(data.page).toBe(100);
    });

    it('should normalize invalid page to 1', async () => {
      roleRepository.addRole(createTestRole('editor', 'Editor role'));

      const query = new ListRolesQuery(-5, 10);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.page).toBe(1);
    });

    it('should normalize invalid limit to 1', async () => {
      roleRepository.addRole(createTestRole('editor', 'Editor role'));

      const query = new ListRolesQuery(1, -10);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.limit).toBe(1);
    });

    it('should cap limit at maximum of 100', async () => {
      roleRepository.addRole(createTestRole('editor', 'Editor role'));

      const query = new ListRolesQuery(1, 500);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.limit).toBe(100);
    });
  });

  describe('DTO mapping', () => {
    it('should map role entity to DTO correctly', async () => {
      const role = createTestRole('editor', 'Can edit content', false);
      roleRepository.addRole(role);

      const query = new ListRolesQuery(1, 10);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const dto = result.getValue().roles[0]!;
      expect(dto.id).toBe(role.id.toValue());
      expect(dto.name).toBe('editor');
      expect(dto.description).toBe('Can edit content');
      expect(dto.isSystem).toBe(false);
      // createdAt is now returned as ISO string for response serialization
      expect(typeof dto.createdAt).toBe('string');
      expect(new Date(dto.createdAt).toISOString()).toBe(dto.createdAt);
    });

    it('should handle null description', async () => {
      const role = createTestRole('viewer', null, false);
      roleRepository.addRole(role);

      const query = new ListRolesQuery(1, 10);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const dto = result.getValue().roles[0]!;
      expect(dto.description).toBeNull();
    });

    it('should correctly indicate system roles', async () => {
      const systemRole = createTestRole('admin', 'Admin role', true);
      roleRepository.addRole(systemRole);

      const query = new ListRolesQuery(1, 10);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const dto = result.getValue().roles[0]!;
      expect(dto.isSystem).toBe(true);
    });
  });

  describe('including permissions', () => {
    it('should not include permissions by default', async () => {
      const role = createTestRole('editor', null);
      roleRepository.addRole(role);
      roleRepository.setPermissionsForRole(role.id.toValue(), ['posts:read', 'posts:write']);

      const query = new ListRolesQuery(1, 10, false);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const dto = result.getValue().roles[0]!;
      expect(dto.permissions).toBeUndefined();
    });

    it('should include permissions when requested', async () => {
      const role = createTestRole('editor', null);
      roleRepository.addRole(role);
      roleRepository.setPermissionsForRole(role.id.toValue(), ['posts:read', 'posts:write']);

      const query = new ListRolesQuery(1, 10, true);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const dto = result.getValue().roles[0]!;
      expect(dto.permissions).toBeDefined();
      expect(dto.permissions!.length).toBe(2);
      expect(dto.permissions).toContain('posts:read');
      expect(dto.permissions).toContain('posts:write');
    });

    it('should handle role with no permissions', async () => {
      const role = createTestRole('viewer', null);
      roleRepository.addRole(role);

      const query = new ListRolesQuery(1, 10, true);

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const dto = result.getValue().roles[0]!;
      expect(dto.permissions).toBeDefined();
      expect(dto.permissions!.length).toBe(0);
    });
  });

  describe('query properties', () => {
    it('should use default values when not specified', () => {
      const query = new ListRolesQuery();

      expect(query.page).toBe(1);
      expect(query.limit).toBe(10);
      expect(query.includePermissions).toBe(false);
    });

    it('should accept custom values', () => {
      const query = new ListRolesQuery(5, 25, true);

      expect(query.page).toBe(5);
      expect(query.limit).toBe(25);
      expect(query.includePermissions).toBe(true);
    });
  });
});
