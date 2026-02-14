import { describe, it, expect } from 'vitest';
import { Role, SystemRoles } from '@auth/domain/value-objects/Role.ts';
import { ErrorCode, getErrorMessage } from '@shared/domain/errors/ErrorCodes.ts';

describe('Role Value Object', () => {
  describe('create', () => {
    it('should create a valid role', () => {
      const result = Role.create('editor');

      expect(result.isOk).toBe(true);
      expect(result.getValue().getValue()).toBe('editor');
    });

    it('should create role with lowercase name', () => {
      const result = Role.create('Manager');

      expect(result.isOk).toBe(true);
      expect(result.getValue().getValue()).toBe('manager');
    });

    it('should create role with underscores', () => {
      const result = Role.create('super_admin');

      expect(result.isOk).toBe(true);
      expect(result.getValue().getValue()).toBe('super_admin');
    });

    it('should create role with numbers', () => {
      const result = Role.create('tier1_support');

      expect(result.isOk).toBe(true);
      expect(result.getValue().getValue()).toBe('tier1_support');
    });

    it('should reject empty role name', () => {
      const result = Role.create('');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(getErrorMessage(ErrorCode.ROLE_NAME_REQUIRED));
    });

    it('should reject role with spaces', () => {
      const result = Role.create('super admin');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(getErrorMessage(ErrorCode.ROLE_NAME_INVALID_FORMAT));
    });

    it('should reject role with special characters', () => {
      const result = Role.create('admin@role');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(getErrorMessage(ErrorCode.ROLE_NAME_INVALID_FORMAT));
    });

    it('should reject role with hyphens', () => {
      const result = Role.create('super-admin');

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(getErrorMessage(ErrorCode.ROLE_NAME_INVALID_FORMAT));
    });

    it('should reject role that is too long', () => {
      const longName = 'a'.repeat(51);
      const result = Role.create(longName);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(getErrorMessage(ErrorCode.ROLE_NAME_TOO_LONG));
    });

    it('should accept role with exactly 50 characters', () => {
      const name = 'a'.repeat(50);
      const result = Role.create(name);

      expect(result.isOk).toBe(true);
    });
  });

  describe('SystemRoles', () => {
    it('should have ADMIN constant', () => {
      expect(SystemRoles.ADMIN).toBe('admin');
    });

    it('should have USER constant', () => {
      expect(SystemRoles.USER).toBe('user');
    });

    it('should create admin role successfully', () => {
      const result = Role.create(SystemRoles.ADMIN);

      expect(result.isOk).toBe(true);
      expect(result.getValue().getValue()).toBe('admin');
    });

    it('should create user role successfully', () => {
      const result = Role.create(SystemRoles.USER);

      expect(result.isOk).toBe(true);
      expect(result.getValue().getValue()).toBe('user');
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin role', () => {
      const role = Role.create('admin').getValue();

      expect(role.isAdmin()).toBe(true);
    });

    it('should return false for non-admin roles', () => {
      const userRole = Role.create('user').getValue();
      const editorRole = Role.create('editor').getValue();

      expect(userRole.isAdmin()).toBe(false);
      expect(editorRole.isAdmin()).toBe(false);
    });
  });

  describe('isUser', () => {
    it('should return true for user role', () => {
      const role = Role.create('user').getValue();

      expect(role.isUser()).toBe(true);
    });

    it('should return false for non-user roles', () => {
      const adminRole = Role.create('admin').getValue();
      const editorRole = Role.create('editor').getValue();

      expect(adminRole.isUser()).toBe(false);
      expect(editorRole.isUser()).toBe(false);
    });
  });

  describe('isSystemRole', () => {
    it('should return true for admin role', () => {
      const role = Role.create('admin').getValue();

      expect(role.isSystemRole()).toBe(true);
    });

    it('should return false for custom roles', () => {
      const role = Role.create('editor').getValue();

      expect(role.isSystemRole()).toBe(false);
    });

    it('should return false for user role (only admin is protected)', () => {
      const role = Role.create('user').getValue();

      // Based on the implementation, only admin is a system role
      // user role is configurable
      expect(role.isSystemRole()).toBe(false);
    });
  });

  describe('getValue', () => {
    it('should return the role name string', () => {
      const role = Role.create('moderator').getValue();

      expect(role.getValue()).toBe('moderator');
    });
  });

  describe('equals', () => {
    it('should return true for roles with same name', () => {
      const role1 = Role.create('editor').getValue();
      const role2 = Role.create('editor').getValue();

      expect(role1.equals(role2)).toBe(true);
    });

    it('should return true for same name with different casing', () => {
      const role1 = Role.create('Editor').getValue();
      const role2 = Role.create('editor').getValue();

      expect(role1.equals(role2)).toBe(true);
    });

    it('should return false for roles with different names', () => {
      const role1 = Role.create('editor').getValue();
      const role2 = Role.create('viewer').getValue();

      expect(role1.equals(role2)).toBe(false);
    });

    it('should handle comparison with another role instance', () => {
      const role1 = Role.create('editor').getValue();
      const role2 = Role.create('editor').getValue();

      // Two instances with same value are equal
      expect(role1.equals(role2)).toBe(true);
    });
  });

  describe('getValue', () => {
    it('should return the role name string', () => {
      const role = Role.create('moderator').getValue();

      expect(role.getValue()).toBe('moderator');
    });
  });

  describe('static factory methods', () => {
    describe('admin', () => {
      it('should create admin role using factory method', () => {
        const role = Role.admin();

        expect(role.getValue()).toBe('admin');
        expect(role.isAdmin()).toBe(true);
      });
    });

    describe('user', () => {
      it('should create user role using factory method', () => {
        const role = Role.user();

        expect(role.getValue()).toBe('user');
        expect(role.isUser()).toBe(true);
      });
    });
  });

  describe('getSystemRoles', () => {
    it('should return array of system role names', () => {
      const systemRoles = Role.getSystemRoles();

      expect(systemRoles).toContain('admin');
      expect(systemRoles).toContain('user');
      expect(systemRoles.length).toBe(2);
    });

    it('should return same values as SystemRoles constants', () => {
      const systemRoles = Role.getSystemRoles();

      expect(systemRoles).toContain(SystemRoles.ADMIN);
      expect(systemRoles).toContain(SystemRoles.USER);
    });
  });

  describe('common role patterns', () => {
    const validRoles = [
      'admin',
      'user',
      'moderator',
      'editor',
      'viewer',
      'guest',
      'super_admin',
      'content_manager',
      'support_tier1',
      'support_tier2',
    ];

    it.each(validRoles)('should accept valid role name: %s', (roleName) => {
      const result = Role.create(roleName);
      expect(result.isOk).toBe(true);
    });
  });
});
