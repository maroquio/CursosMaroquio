import { describe, it, expect, beforeEach } from 'vitest';
import { GetUserPermissionsHandler } from '@auth/application/queries/get-user-permissions/GetUserPermissionsHandler.ts';
import { GetUserPermissionsQuery } from '@auth/application/queries/get-user-permissions/GetUserPermissionsQuery.ts';
import {
  MockUserRepository,
  MockPermissionService,
  createTestAdmin,
  createTestUser,
} from '../../mocks/index.ts';
import { User } from '@auth/domain/entities/User.ts';
import { Email } from '@auth/domain/value-objects/Email.ts';
import { Password } from '@auth/domain/value-objects/Password.ts';
import { Role, SystemRoles } from '@auth/domain/value-objects/Role.ts';

describe('GetUserPermissionsHandler', () => {
  let handler: GetUserPermissionsHandler;
  let userRepository: MockUserRepository;
  let permissionService: MockPermissionService;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    permissionService = new MockPermissionService();
    handler = new GetUserPermissionsHandler(userRepository, permissionService);
  });

  /**
   * Helper to create a user with multiple roles
   */
  function createUserWithRoles(emailStr: string, ...roleNames: string[]): User {
    const email = Email.create(emailStr).getValue();
    const password = Password.create('$2a$10$hashedpasswordvalue123456789').getValue();
    const roles = roleNames.map((name) => Role.create(name).getValue());
    return User.create(email, password, 'Test User', '11999999999', roles).getValue();
  }

  describe('successful permission retrieval', () => {
    it('should return user permissions and roles', async () => {
      const user = createTestUser('user@example.com');
      userRepository.addUser(user);
      permissionService.setUserPermissions(user.getId().toValue(), [
        'posts:read',
        'posts:write',
        'comments:read',
      ]);

      const query = new GetUserPermissionsQuery(user.getId().toValue());

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.userId).toBe(user.getId().toValue());
      expect(data.permissions).toContain('posts:read');
      expect(data.permissions).toContain('posts:write');
      expect(data.permissions).toContain('comments:read');
      expect(data.permissions.length).toBe(3);
    });

    it('should return empty permissions for user with no permissions', async () => {
      const user = createTestUser('user@example.com');
      userRepository.addUser(user);
      permissionService.setUserPermissions(user.getId().toValue(), []);

      const query = new GetUserPermissionsQuery(user.getId().toValue());

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.permissions).toEqual([]);
    });

    it('should return correct role names', async () => {
      const user = createUserWithRoles('user@example.com', 'editor', 'moderator');
      userRepository.addUser(user);
      permissionService.setUserPermissions(user.getId().toValue(), ['posts:read']);

      const query = new GetUserPermissionsQuery(user.getId().toValue());

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.roles).toContain('editor');
      expect(data.roles).toContain('moderator');
      expect(data.roles.length).toBe(2);
    });

    it('should work correctly for admin users', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);
      permissionService.setUserPermissions(admin.getId().toValue(), [
        '*', // Wildcard permission
      ]);

      const query = new GetUserPermissionsQuery(admin.getId().toValue());

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.permissions).toContain('*');
      expect(data.roles).toContain(SystemRoles.ADMIN);
    });
  });

  describe('validation failures', () => {
    it('should fail with invalid user ID format', async () => {
      const query = new GetUserPermissionsQuery('invalid-id');

      const result = await handler.execute(query);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Invalid user ID');
    });

    it('should fail when user is not found', async () => {
      const query = new GetUserPermissionsQuery('019123ab-cdef-7890-abcd-ef1234567890');

      const result = await handler.execute(query);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('User not found');
    });
  });

  describe('response structure', () => {
    it('should return correctly structured response', async () => {
      const user = createUserWithRoles('user@example.com', 'user', 'editor');
      userRepository.addUser(user);
      permissionService.setUserPermissions(user.getId().toValue(), [
        'posts:read',
        'posts:write',
      ]);

      const query = new GetUserPermissionsQuery(user.getId().toValue());

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();

      // Verify response has all required fields
      expect(data).toHaveProperty('userId');
      expect(data).toHaveProperty('permissions');
      expect(data).toHaveProperty('roles');

      // Verify types
      expect(typeof data.userId).toBe('string');
      expect(Array.isArray(data.permissions)).toBe(true);
      expect(Array.isArray(data.roles)).toBe(true);
    });

    it('should return userId as string, not object', async () => {
      const user = createTestUser('user@example.com');
      userRepository.addUser(user);
      permissionService.setUserPermissions(user.getId().toValue(), []);

      const query = new GetUserPermissionsQuery(user.getId().toValue());

      const result = await handler.execute(query);

      expect(result.isOk).toBe(true);
      const data = result.getValue();
      expect(data.userId).toBe(user.getId().toValue());
      expect(typeof data.userId).toBe('string');
    });
  });

  describe('query properties', () => {
    it('should correctly store query properties', () => {
      const query = new GetUserPermissionsQuery('019123ab-cdef-7890-abcd-ef1234567890');

      expect(query.userId).toBe('019123ab-cdef-7890-abcd-ef1234567890');
    });
  });
});
