import { describe, it, expect, beforeEach } from 'vitest';
import { User } from '@auth/domain/entities/User.ts';
import { Email } from '@auth/domain/value-objects/Email.ts';
import { Password } from '@auth/domain/value-objects/Password.ts';
import { Role, SystemRoles } from '@auth/domain/value-objects/Role.ts';
import { Permission } from '@auth/domain/value-objects/Permission.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

describe('User Entity', () => {
  let validEmail: Email;
  let validPassword: Password;
  const validFullName = 'Test User';
  const validPhone = '11999999999';

  beforeEach(() => {
    validEmail = Email.create('test@example.com').getValue();
    validPassword = Password.create('$2a$10$hashedpasswordvalue123456789').getValue();
  });

  describe('create', () => {
    it('should create a user with default role', () => {
      const result = User.create(validEmail, validPassword, validFullName, validPhone);

      expect(result.isOk).toBe(true);
      const user = result.getValue();
      expect(user.getEmail().getValue()).toBe('test@example.com');
      expect(user.hasRole(SystemRoles.USER)).toBe(true);
    });

    it('should create a user with specified roles', () => {
      const adminRole = Role.create(SystemRoles.ADMIN).getValue();
      const result = User.create(validEmail, validPassword, validFullName, validPhone, [adminRole]);

      expect(result.isOk).toBe(true);
      const user = result.getValue();
      expect(user.hasRole(SystemRoles.ADMIN)).toBe(true);
      expect(user.hasRole(SystemRoles.USER)).toBe(false);
    });

    it('should emit UserCreated domain event', () => {
      const result = User.create(validEmail, validPassword, validFullName, validPhone);
      const user = result.getValue();

      const events = user.getDomainEvents();
      expect(events.length).toBe(1);
      expect(events[0]!.constructor.name).toBe('UserCreated');
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct user without emitting events', () => {
      const userId = UserId.create();
      const roles = [Role.create('editor').getValue()];
      const permissions = [Permission.create('posts:read').getValue()];

      const user = User.reconstruct(
        userId,
        validEmail,
        validPassword,
        validFullName,
        validPhone,
        true,
        new Date(),
        roles,
        permissions
      );

      expect(user.getId().equals(userId)).toBe(true);
      expect(user.hasRole('editor')).toBe(true);
      expect(user.getDomainEvents().length).toBe(0);
    });
  });

  describe('getters', () => {
    it('should return email', () => {
      const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
      expect(user.getEmail().getValue()).toBe('test@example.com');
    });

    it('should return password', () => {
      const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
      expect(user.getPassword()).toBe(validPassword);
    });

    it('should return createdAt', () => {
      const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
      expect(user.getCreatedAt()).toBeInstanceOf(Date);
    });
  });

  describe('hasPasswordHash', () => {
    it('should return true for matching hash', () => {
      const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
      expect(user.hasPasswordHash('$2a$10$hashedpasswordvalue123456789')).toBe(true);
    });

    it('should return false for non-matching hash', () => {
      const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
      expect(user.hasPasswordHash('wrong_hash')).toBe(false);
    });
  });

  describe('role management', () => {
    describe('getRoles', () => {
      it('should return a copy of roles array', () => {
        const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
        const roles = user.getRoles();
        roles.push(Role.create('hacker').getValue());

        // Original should not be modified
        expect(user.getRoles().length).toBe(1);
      });
    });

    describe('getRoleNames', () => {
      it('should return role names as strings', () => {
        const adminRole = Role.create(SystemRoles.ADMIN).getValue();
        const editorRole = Role.create('editor').getValue();
        const user = User.create(validEmail, validPassword, validFullName, validPhone, [adminRole, editorRole]).getValue();

        const names = user.getRoleNames();
        expect(names).toContain(SystemRoles.ADMIN);
        expect(names).toContain('editor');
      });
    });

    describe('hasRole', () => {
      it('should check role by string', () => {
        const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
        expect(user.hasRole('user')).toBe(true);
        expect(user.hasRole('admin')).toBe(false);
      });

      it('should check role by Role object', () => {
        const userRole = Role.create(SystemRoles.USER).getValue();
        const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
        expect(user.hasRole(userRole)).toBe(true);
      });
    });

    describe('hasAnyRole', () => {
      it('should return true if user has any of the roles', () => {
        const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
        expect(user.hasAnyRole(['admin', 'user', 'editor'])).toBe(true);
      });

      it('should return false if user has none of the roles', () => {
        const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
        expect(user.hasAnyRole(['admin', 'editor'])).toBe(false);
      });

      it('should work with Role objects', () => {
        const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
        const adminRole = Role.create('admin').getValue();
        const userRole = Role.create('user').getValue();
        expect(user.hasAnyRole([adminRole, userRole])).toBe(true);
      });
    });

    describe('hasAllRoles', () => {
      it('should return true if user has all roles', () => {
        const adminRole = Role.create(SystemRoles.ADMIN).getValue();
        const editorRole = Role.create('editor').getValue();
        const user = User.create(validEmail, validPassword, validFullName, validPhone, [adminRole, editorRole]).getValue();

        expect(user.hasAllRoles(['admin', 'editor'])).toBe(true);
      });

      it('should return false if user is missing a role', () => {
        const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
        expect(user.hasAllRoles(['user', 'admin'])).toBe(false);
      });

      it('should work with Role objects', () => {
        const adminRole = Role.create(SystemRoles.ADMIN).getValue();
        const user = User.create(validEmail, validPassword, validFullName, validPhone, [adminRole]).getValue();
        expect(user.hasAllRoles([adminRole])).toBe(true);
      });
    });

    describe('isAdmin', () => {
      it('should return true for admin user', () => {
        const adminRole = Role.create(SystemRoles.ADMIN).getValue();
        const user = User.create(validEmail, validPassword, validFullName, validPhone, [adminRole]).getValue();
        expect(user.isAdmin()).toBe(true);
      });

      it('should return false for non-admin user', () => {
        const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
        expect(user.isAdmin()).toBe(false);
      });
    });

    describe('assignRole', () => {
      it('should assign a new role', () => {
        const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
        const editorRole = Role.create('editor').getValue();

        const result = user.assignRole(editorRole);

        expect(result.isOk).toBe(true);
        expect(user.hasRole('editor')).toBe(true);
      });

      it('should emit RoleAssigned event', () => {
        const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
        user.clearDomainEvents();

        const editorRole = Role.create('editor').getValue();
        user.assignRole(editorRole);

        const events = user.getDomainEvents();
        expect(events.some(e => e.constructor.name === 'RoleAssigned')).toBe(true);
      });

      it('should fail if role already assigned', () => {
        const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
        const result = user.assignRole(Role.create('user').getValue());

        expect(result.isFailure).toBe(true);
        expect(result.getError()).toBe(ErrorCode.USER_ALREADY_HAS_ROLE);
      });

      it('should record assignedBy user', () => {
        const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
        user.clearDomainEvents();

        const assignerId = UserId.create();
        const editorRole = Role.create('editor').getValue();
        user.assignRole(editorRole, assignerId);

        const events = user.getDomainEvents();
        const roleAssignedEvent = events.find(e => e.constructor.name === 'RoleAssigned');
        expect(roleAssignedEvent).toBeDefined();
      });
    });

    describe('removeRole', () => {
      it('should remove an existing role', () => {
        const adminRole = Role.create(SystemRoles.ADMIN).getValue();
        const userRole = Role.create(SystemRoles.USER).getValue();
        const user = User.create(validEmail, validPassword, validFullName, validPhone, [adminRole, userRole]).getValue();

        const result = user.removeRole(userRole);

        expect(result.isOk).toBe(true);
        expect(user.hasRole('user')).toBe(false);
      });

      it('should emit RoleRemoved event', () => {
        const adminRole = Role.create(SystemRoles.ADMIN).getValue();
        const userRole = Role.create(SystemRoles.USER).getValue();
        const user = User.create(validEmail, validPassword, validFullName, validPhone, [adminRole, userRole]).getValue();
        user.clearDomainEvents();

        user.removeRole(userRole);

        const events = user.getDomainEvents();
        expect(events.some(e => e.constructor.name === 'RoleRemoved')).toBe(true);
      });

      it('should fail if role not found', () => {
        const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
        const result = user.removeRole(Role.create('editor').getValue());

        expect(result.isFailure).toBe(true);
        expect(result.getError()).toBe(ErrorCode.USER_DOES_NOT_HAVE_ROLE);
      });

      it('should fail when removing last role', () => {
        const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
        const result = user.removeRole(Role.create('user').getValue());

        expect(result.isFailure).toBe(true);
        expect(result.getError()).toBe(ErrorCode.ROLE_CANNOT_REMOVE_LAST);
      });
    });
  });

  describe('individual permission management', () => {
    describe('getIndividualPermissions', () => {
      it('should return empty array when no permissions', () => {
        const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
        expect(user.getIndividualPermissions()).toEqual([]);
      });

      it('should return a copy of permissions array', () => {
        const permission = Permission.create('posts:read').getValue();
        const user = User.reconstruct(
          UserId.create(),
          validEmail,
          validPassword,
          validFullName,
          validPhone,
          true,
          new Date(),
          [Role.user()],
          [permission]
        );

        const perms = user.getIndividualPermissions();
        expect(perms.length).toBe(1);
        perms.push(Permission.create('posts:write').getValue());

        // Original should not be modified
        expect(user.getIndividualPermissions().length).toBe(1);
      });
    });

    describe('getIndividualPermissionNames', () => {
      it('should return permission names as strings', () => {
        const perm1 = Permission.create('posts:read').getValue();
        const perm2 = Permission.create('posts:write').getValue();
        const user = User.reconstruct(
          UserId.create(),
          validEmail,
          validPassword,
          validFullName,
          validPhone,
          true,
          new Date(),
          [Role.user()],
          [perm1, perm2]
        );

        const names = user.getIndividualPermissionNames();
        expect(names).toContain('posts:read');
        expect(names).toContain('posts:write');
      });
    });

    describe('hasIndividualPermission', () => {
      it('should check permission by string', () => {
        const permission = Permission.create('posts:read').getValue();
        const user = User.reconstruct(
          UserId.create(),
          validEmail,
          validPassword,
          validFullName,
          validPhone,
          true,
          new Date(),
          [Role.user()],
          [permission]
        );

        expect(user.hasIndividualPermission('posts:read')).toBe(true);
        expect(user.hasIndividualPermission('posts:write')).toBe(false);
      });

      it('should check permission by Permission object', () => {
        const permission = Permission.create('posts:read').getValue();
        const user = User.reconstruct(
          UserId.create(),
          validEmail,
          validPassword,
          validFullName,
          validPhone,
          true,
          new Date(),
          [Role.user()],
          [permission]
        );

        expect(user.hasIndividualPermission(permission)).toBe(true);
      });
    });

    describe('hasIndividualPermissionGrant', () => {
      it('should check if wildcard permission grants requested', () => {
        const wildcardPerm = Permission.create('posts:*').getValue();
        const user = User.reconstruct(
          UserId.create(),
          validEmail,
          validPassword,
          validFullName,
          validPhone,
          true,
          new Date(),
          [Role.user()],
          [wildcardPerm]
        );

        const requestedPerm = Permission.create('posts:read').getValue();
        expect(user.hasIndividualPermissionGrant(requestedPerm)).toBe(true);
      });

      it('should return false when no matching grant', () => {
        const permission = Permission.create('posts:read').getValue();
        const user = User.reconstruct(
          UserId.create(),
          validEmail,
          validPassword,
          validFullName,
          validPhone,
          true,
          new Date(),
          [Role.user()],
          [permission]
        );

        const requestedPerm = Permission.create('posts:write').getValue();
        expect(user.hasIndividualPermissionGrant(requestedPerm)).toBe(false);
      });
    });

    describe('assignPermission', () => {
      it('should assign a new permission', () => {
        const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
        const permission = Permission.create('posts:read').getValue();

        const result = user.assignPermission(permission);

        expect(result.isOk).toBe(true);
        expect(user.hasIndividualPermission('posts:read')).toBe(true);
      });

      it('should emit PermissionAssignedToUser event', () => {
        const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
        user.clearDomainEvents();

        const permission = Permission.create('posts:read').getValue();
        user.assignPermission(permission);

        const events = user.getDomainEvents();
        expect(events.some(e => e.constructor.name === 'PermissionAssignedToUser')).toBe(true);
      });

      it('should fail if permission already assigned', () => {
        const permission = Permission.create('posts:read').getValue();
        const user = User.reconstruct(
          UserId.create(),
          validEmail,
          validPassword,
          validFullName,
          validPhone,
          true,
          new Date(),
          [Role.user()],
          [permission]
        );

        const result = user.assignPermission(permission);

        expect(result.isFailure).toBe(true);
        expect(result.getError()).toBe(ErrorCode.USER_ALREADY_HAS_PERMISSION);
      });

      it('should record assignedBy user', () => {
        const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
        user.clearDomainEvents();

        const assignerId = UserId.create();
        const permission = Permission.create('posts:read').getValue();
        user.assignPermission(permission, assignerId);

        const events = user.getDomainEvents();
        const permAssignedEvent = events.find(e => e.constructor.name === 'PermissionAssignedToUser');
        expect(permAssignedEvent).toBeDefined();
      });
    });

    describe('removePermission', () => {
      it('should remove an existing permission', () => {
        const permission = Permission.create('posts:read').getValue();
        const user = User.reconstruct(
          UserId.create(),
          validEmail,
          validPassword,
          validFullName,
          validPhone,
          true,
          new Date(),
          [Role.user()],
          [permission]
        );

        const result = user.removePermission(permission);

        expect(result.isOk).toBe(true);
        expect(user.hasIndividualPermission('posts:read')).toBe(false);
      });

      it('should emit PermissionRemovedFromUser event', () => {
        const permission = Permission.create('posts:read').getValue();
        const user = User.reconstruct(
          UserId.create(),
          validEmail,
          validPassword,
          validFullName,
          validPhone,
          true,
          new Date(),
          [Role.user()],
          [permission]
        );
        user.clearDomainEvents();

        user.removePermission(permission);

        const events = user.getDomainEvents();
        expect(events.some(e => e.constructor.name === 'PermissionRemovedFromUser')).toBe(true);
      });

      it('should fail if permission not found', () => {
        const user = User.create(validEmail, validPassword, validFullName, validPhone).getValue();
        const permission = Permission.create('posts:read').getValue();

        const result = user.removePermission(permission);

        expect(result.isFailure).toBe(true);
        expect(result.getError()).toBe(ErrorCode.USER_DOES_NOT_HAVE_PERMISSION);
      });

      it('should record removedBy user', () => {
        const permission = Permission.create('posts:read').getValue();
        const user = User.reconstruct(
          UserId.create(),
          validEmail,
          validPassword,
          validFullName,
          validPhone,
          true,
          new Date(),
          [Role.user()],
          [permission]
        );
        user.clearDomainEvents();

        const removerId = UserId.create();
        user.removePermission(permission, removerId);

        const events = user.getDomainEvents();
        const permRemovedEvent = events.find(e => e.constructor.name === 'PermissionRemovedFromUser');
        expect(permRemovedEvent).toBeDefined();
      });
    });

    describe('setIndividualPermissions', () => {
      it('should replace all permissions', () => {
        const perm1 = Permission.create('posts:read').getValue();
        const user = User.reconstruct(
          UserId.create(),
          validEmail,
          validPassword,
          validFullName,
          validPhone,
          true,
          new Date(),
          [Role.user()],
          [perm1]
        );

        const newPerms = [
          Permission.create('users:read').getValue(),
          Permission.create('users:write').getValue(),
        ];
        user.setIndividualPermissions(newPerms);

        expect(user.hasIndividualPermission('posts:read')).toBe(false);
        expect(user.hasIndividualPermission('users:read')).toBe(true);
        expect(user.hasIndividualPermission('users:write')).toBe(true);
      });
    });
  });
});
