import { describe, it, expect, beforeEach } from 'vitest';
import { CreatePermissionHandler } from '@auth/application/commands/create-permission/CreatePermissionHandler.ts';
import { CreatePermissionCommand } from '@auth/application/commands/create-permission/CreatePermissionCommand.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import {
  MockUserRepository,
  MockPermissionRepository,
  createTestAdmin,
  createTestUser,
  createTestPermission,
} from '../../mocks/index.ts';

describe('CreatePermissionHandler', () => {
  let handler: CreatePermissionHandler;
  let userRepository: MockUserRepository;
  let permissionRepository: MockPermissionRepository;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    permissionRepository = new MockPermissionRepository();
    handler = new CreatePermissionHandler(userRepository, permissionRepository);
  });

  describe('successful permission creation', () => {
    it('should create a permission when admin requests it', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreatePermissionCommand(
        'reports:export',
        'Export reports to PDF',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      const permission = result.getValue();
      expect(permission.name).toBe('reports:export');
      expect(permission.resource).toBe('reports');
      expect(permission.action).toBe('export');
      expect(permission.description).toBe('Export reports to PDF');
    });

    it('should save permission to repository', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreatePermissionCommand(
        'files:upload',
        null,
        admin.getId().toValue()
      );

      await handler.execute(command);

      const saved = permissionRepository.getAll();
      expect(saved.length).toBe(1);
      expect(saved[0]!.name).toBe('files:upload');
    });

    it('should normalize permission name to lowercase', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreatePermissionCommand(
        'Users:READ',
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      expect(result.getValue().name).toBe('users:read');
    });

    it('should accept wildcard permissions', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreatePermissionCommand(
        'billing:*',
        'Full billing access',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      expect(result.getValue().action).toBe('*');
    });

    it('should accept permissions with underscores', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreatePermissionCommand(
        'user_profiles:read_all',
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      expect(result.getValue().resource).toBe('user_profiles');
      expect(result.getValue().action).toBe('read_all');
    });
  });

  describe('authorization failures', () => {
    it('should fail when creator is not an admin', async () => {
      const regularUser = createTestUser();
      userRepository.addUser(regularUser);

      const command = new CreatePermissionCommand(
        'reports:create',
        null,
        regularUser.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('administrators');
    });

    it('should fail when creator user is not found', async () => {
      const command = new CreatePermissionCommand(
        'reports:create',
        null,
        '019123ab-cdef-7890-abcd-ef1234567890'
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('not found');
    });

    it('should fail with invalid creator user ID format', async () => {
      const command = new CreatePermissionCommand(
        'reports:create',
        null,
        'invalid-id'
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Invalid');
    });
  });

  describe('validation failures', () => {
    it('should fail when permission already exists', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      // Add existing permission
      const existing = createTestPermission('reports:view', 'View reports');
      permissionRepository.addPermission(existing);

      const command = new CreatePermissionCommand(
        'reports:view',
        'View reports',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('already exists');
    });

    it('should fail with invalid permission format (no colon)', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreatePermissionCommand(
        'reportsview',
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PERMISSION_INVALID_FORMAT);
    });

    it('should fail with empty resource', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreatePermissionCommand(
        ':read',
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PERMISSION_RESOURCE_EMPTY);
    });

    it('should fail with empty action', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreatePermissionCommand(
        'reports:',
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PERMISSION_ACTION_EMPTY);
    });

    it('should fail with resource starting with number', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreatePermissionCommand(
        '123reports:read',
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PERMISSION_RESOURCE_INVALID_FORMAT);
    });

    it('should fail with special characters in resource', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreatePermissionCommand(
        'reports@admin:read',
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PERMISSION_RESOURCE_INVALID_FORMAT);
    });

    it('should fail with multiple colons', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreatePermissionCommand(
        'api:v1:read',
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PERMISSION_INVALID_FORMAT);
    });

    it('should fail with empty permission name', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreatePermissionCommand(
        '',
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBe(ErrorCode.PERMISSION_EMPTY);
    });
  });

  describe('command properties', () => {
    it('should correctly store command properties', () => {
      const command = new CreatePermissionCommand(
        'dashboard:view',
        'View dashboard',
        '019123ab-cdef-7890-abcd-ef1234567890'
      );

      expect(command.name).toBe('dashboard:view');
      expect(command.description).toBe('View dashboard');
      expect(command.createdByUserId).toBe('019123ab-cdef-7890-abcd-ef1234567890');
    });

    it('should allow null description', () => {
      const command = new CreatePermissionCommand(
        'settings:read',
        null,
        '019123ab-cdef-7890-abcd-ef1234567890'
      );

      expect(command.description).toBeNull();
    });
  });
});
