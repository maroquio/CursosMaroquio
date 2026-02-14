import { describe, it, expect } from 'vitest';
import { Permission } from '@auth/domain/value-objects/Permission.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

describe('Permission Value Object', () => {
  describe('create', () => {
    it('should create a valid permission with resource:action format', () => {
      const result = Permission.create('users:read');

      expect(result.isOk).toBe(true);
      const permission = result.getValue();
      expect(permission.getValue()).toBe('users:read');
      expect(permission.getResource()).toBe('users');
      expect(permission.getAction()).toBe('read');
    });

    it('should create permission with wildcard action', () => {
      const result = Permission.create('admin:*');

      expect(result.isOk).toBe(true);
      const permission = result.getValue();
      expect(permission.getValue()).toBe('admin:*');
      expect(permission.getResource()).toBe('admin');
      expect(permission.getAction()).toBe('*');
      expect(permission.isWildcard()).toBe(true);
    });

    it('should normalize to lowercase', () => {
      const result = Permission.create('Users:READ');

      expect(result.isOk).toBe(true);
      const permission = result.getValue();
      expect(permission.getValue()).toBe('users:read');
    });

    it('should reject empty permission name', () => {
      const result = Permission.create('');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PERMISSION_EMPTY);
    });

    it('should reject permission without colon separator', () => {
      const result = Permission.create('usersread');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PERMISSION_INVALID_FORMAT);
    });

    it('should reject permission with empty resource', () => {
      const result = Permission.create(':read');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PERMISSION_RESOURCE_EMPTY);
    });

    it('should reject permission with empty action', () => {
      const result = Permission.create('users:');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PERMISSION_ACTION_EMPTY);
    });

    it('should reject resource with special characters', () => {
      const result = Permission.create('user@admin:read');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PERMISSION_RESOURCE_INVALID_FORMAT);
    });

    it('should reject resource starting with number', () => {
      const result = Permission.create('123users:read');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PERMISSION_RESOURCE_INVALID_FORMAT);
    });

    it('should reject action with special characters', () => {
      const result = Permission.create('users:read@all');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PERMISSION_ACTION_INVALID_FORMAT);
    });

    it('should accept resource with underscores', () => {
      const result = Permission.create('user_profiles:read');

      expect(result.isOk).toBe(true);
      expect(result.getValue().getResource()).toBe('user_profiles');
    });

    it('should accept action with underscores', () => {
      const result = Permission.create('users:read_all');

      expect(result.isOk).toBe(true);
      expect(result.getValue().getAction()).toBe('read_all');
    });

    it('should accept resource with numbers', () => {
      const result = Permission.create('api2:read');

      expect(result.isOk).toBe(true);
      expect(result.getValue().getResource()).toBe('api2');
    });

    it('should reject permission with more than one colon', () => {
      const result = Permission.create('api:v1:read');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PERMISSION_INVALID_FORMAT);
    });

    it('should reject full wildcard (*:*)', () => {
      const result = Permission.create('*:*');

      expect(result.isFailure).toBe(true);
      // * doesn't match the resource pattern (must start with letter)
    });
  });

  describe('createFromParts', () => {
    it('should create permission from separate resource and action', () => {
      const result = Permission.createFromParts('users', 'delete');

      expect(result.isOk).toBe(true);
      expect(result.getValue().getValue()).toBe('users:delete');
    });

    it('should reject invalid resource', () => {
      const result = Permission.createFromParts('123invalid', 'read');

      expect(result.isFailure).toBe(true);
    });
  });

  describe('matches', () => {
    it('should match exact same permission', () => {
      const permission1 = Permission.create('users:read').getValue();
      const permission2 = Permission.create('users:read').getValue();

      expect(permission1.matches(permission2)).toBe(true);
    });

    it('should not match different action', () => {
      const permission1 = Permission.create('users:read').getValue();
      const permission2 = Permission.create('users:write').getValue();

      expect(permission1.matches(permission2)).toBe(false);
    });

    it('should not match different resource', () => {
      const permission1 = Permission.create('users:read').getValue();
      const permission2 = Permission.create('roles:read').getValue();

      expect(permission1.matches(permission2)).toBe(false);
    });

    it('should match wildcard action against specific action', () => {
      const wildcardPerm = Permission.create('users:*').getValue();
      const specificPerm = Permission.create('users:read').getValue();

      expect(wildcardPerm.matches(specificPerm)).toBe(true);
    });

    it('should match specific action against wildcard', () => {
      const specificPerm = Permission.create('users:read').getValue();
      const wildcardPerm = Permission.create('users:*').getValue();

      expect(specificPerm.matches(wildcardPerm)).toBe(true);
    });

    it('should not match wildcard with different resource', () => {
      const wildcardPerm = Permission.create('users:*').getValue();
      const otherPerm = Permission.create('roles:read').getValue();

      expect(wildcardPerm.matches(otherPerm)).toBe(false);
    });
  });

  describe('grants', () => {
    it('should grant exact permission', () => {
      const grantedPerm = Permission.create('users:read').getValue();
      const requestedPerm = Permission.create('users:read').getValue();

      expect(grantedPerm.grants(requestedPerm)).toBe(true);
    });

    it('should grant through wildcard', () => {
      const grantedPerm = Permission.create('users:*').getValue();
      const requestedPerm = Permission.create('users:delete').getValue();

      expect(grantedPerm.grants(requestedPerm)).toBe(true);
    });

    it('should not grant different action without wildcard', () => {
      const grantedPerm = Permission.create('users:read').getValue();
      const requestedPerm = Permission.create('users:write').getValue();

      expect(grantedPerm.grants(requestedPerm)).toBe(false);
    });

    it('should not grant different resource', () => {
      const grantedPerm = Permission.create('users:*').getValue();
      const requestedPerm = Permission.create('roles:read').getValue();

      expect(grantedPerm.grants(requestedPerm)).toBe(false);
    });
  });

  describe('isWildcard', () => {
    it('should return true for wildcard permission', () => {
      const permission = Permission.create('users:*').getValue();

      expect(permission.isWildcard()).toBe(true);
    });

    it('should return false for specific permission', () => {
      const permission = Permission.create('users:read').getValue();

      expect(permission.isWildcard()).toBe(false);
    });
  });

  describe('getValue', () => {
    it('should return the full permission string', () => {
      const permission = Permission.create('reports:export').getValue();

      expect(permission.getValue()).toBe('reports:export');
    });
  });

  describe('equals', () => {
    it('should return true for permissions with same resource and action', () => {
      const permission1 = Permission.create('users:read').getValue();
      const permission2 = Permission.create('users:read').getValue();

      expect(permission1.equals(permission2)).toBe(true);
    });

    it('should return false for permissions with different values', () => {
      const permission1 = Permission.create('users:read').getValue();
      const permission2 = Permission.create('users:write').getValue();

      expect(permission1.equals(permission2)).toBe(false);
    });
  });

  describe('common permission patterns', () => {
    const validPermissions = [
      'users:create',
      'users:read',
      'users:update',
      'users:delete',
      'users:list',
      'roles:create',
      'roles:read',
      'roles:update',
      'roles:delete',
      'roles:assign',
      'permissions:create',
      'permissions:read',
      'permissions:assign',
      'reports:view',
      'reports:export',
      'settings:read',
      'settings:write',
      'admin:*',
      'api:*',
    ];

    it.each(validPermissions)('should create valid permission: %s', (permName) => {
      const result = Permission.create(permName);
      expect(result.isOk).toBe(true);
    });
  });
});
