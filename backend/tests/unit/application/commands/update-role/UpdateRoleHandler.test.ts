import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateRoleHandler } from '@auth/application/commands/update-role/UpdateRoleHandler.ts';
import { UpdateRoleCommand } from '@auth/application/commands/update-role/UpdateRoleCommand.ts';
import {
  MockUserRepository,
  MockRoleRepository,
  createTestAdmin,
  createTestUser,
  createTestRole,
} from '../../mocks/index.ts';

describe('UpdateRoleHandler', () => {
  let handler: UpdateRoleHandler;
  let userRepository: MockUserRepository;
  let roleRepository: MockRoleRepository;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    roleRepository = new MockRoleRepository();
    handler = new UpdateRoleHandler(userRepository, roleRepository);
  });

  describe('successful role updates', () => {
    it('should update role name when admin requests it', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const role = createTestRole('editor', 'Can edit content', false);
      roleRepository.addRole(role);

      const command = new UpdateRoleCommand(
        role.id.toValue(),
        'content_editor',
        null, // Keep description unchanged
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      expect(result.getValue().name).toBe('content_editor');
    });

    it('should update role description', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const role = createTestRole('editor', 'Old description', false);
      roleRepository.addRole(role);

      const command = new UpdateRoleCommand(
        role.id.toValue(),
        null, // Keep name unchanged
        'New improved description',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      expect(result.getValue().description).toBe('New improved description');
    });

    it('should update both name and description', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const role = createTestRole('reviewer', 'Reviews content', false);
      roleRepository.addRole(role);

      const command = new UpdateRoleCommand(
        role.id.toValue(),
        'content_reviewer',
        'Reviews and approves content',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      expect(result.getValue().name).toBe('content_reviewer');
      expect(result.getValue().description).toBe('Reviews and approves content');
    });

    it('should normalize new role name to lowercase', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const role = createTestRole('editor', null, false);
      roleRepository.addRole(role);

      const command = new UpdateRoleCommand(
        role.id.toValue(),
        'ContentManager',
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      expect(result.getValue().name).toBe('contentmanager');
    });

    it('should preserve other fields on update', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const originalCreatedAt = new Date('2024-01-01');
      const role = createTestRole('editor', 'Original desc', false);
      role.createdAt = originalCreatedAt;
      roleRepository.addRole(role);

      const command = new UpdateRoleCommand(
        role.id.toValue(),
        null,
        'Updated desc',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      expect(result.getValue().createdAt).toEqual(originalCreatedAt);
      expect(result.getValue().isSystem).toBe(false);
      expect(result.getValue().updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('authorization failures', () => {
    it('should fail when updater is not an admin', async () => {
      const regularUser = createTestUser();
      userRepository.addUser(regularUser);

      const role = createTestRole('editor', null, false);
      roleRepository.addRole(role);

      const command = new UpdateRoleCommand(
        role.id.toValue(),
        'new_name',
        null,
        regularUser.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('administrators');
    });

    it('should fail when updater is not found', async () => {
      const role = createTestRole('editor', null, false);
      roleRepository.addRole(role);

      const command = new UpdateRoleCommand(
        role.id.toValue(),
        'new_name',
        null,
        '019123ab-cdef-7890-abcd-ef1234567890'
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('not found');
    });

    it('should fail with invalid updater user ID format', async () => {
      const command = new UpdateRoleCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        'new_name',
        null,
        'invalid-id'
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Invalid');
    });
  });

  describe('validation failures', () => {
    it('should fail when role is not found', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new UpdateRoleCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        'new_name',
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Role not found');
    });

    it('should fail with invalid role ID format', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new UpdateRoleCommand(
        'invalid-role-id',
        'new_name',
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Invalid role ID');
    });

    it('should fail when trying to rename a system role', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      // Create a system role
      const systemRole = createTestRole('admin', 'Admin role', true);
      roleRepository.addRole(systemRole);

      const command = new UpdateRoleCommand(
        systemRole.id.toValue(),
        'superadmin', // Try to rename
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('System roles cannot be renamed');
    });

    it('should fail when new name already exists', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const role1 = createTestRole('editor', null, false);
      const role2 = createTestRole('reviewer', null, false);
      roleRepository.addRole(role1);
      roleRepository.addRole(role2);

      const command = new UpdateRoleCommand(
        role1.id.toValue(),
        'reviewer', // Name already taken by role2
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('already exists');
    });

    it('should fail with invalid new role name format', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const role = createTestRole('editor', null, false);
      roleRepository.addRole(role);

      const command = new UpdateRoleCommand(
        role.id.toValue(),
        'super admin', // Invalid: contains space
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should allow updating description of system role', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const systemRole = createTestRole('admin', 'Admin role', true);
      roleRepository.addRole(systemRole);

      const command = new UpdateRoleCommand(
        systemRole.id.toValue(),
        null, // Don't rename
        'Updated admin description', // Just update description
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      expect(result.getValue().description).toBe('Updated admin description');
      expect(result.getValue().name).toBe('admin'); // Name unchanged
    });

    it('should allow setting same name (no-op)', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const role = createTestRole('editor', 'Editor role', false);
      roleRepository.addRole(role);

      const command = new UpdateRoleCommand(
        role.id.toValue(),
        'editor', // Same name
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      expect(result.getValue().name).toBe('editor');
    });
  });

  describe('command properties', () => {
    it('should correctly store command properties', () => {
      const command = new UpdateRoleCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        'new_role_name',
        'New description',
        '019123ab-cdef-7890-abcd-ef1234567891'
      );

      expect(command.roleId).toBe('019123ab-cdef-7890-abcd-ef1234567890');
      expect(command.name).toBe('new_role_name');
      expect(command.description).toBe('New description');
      expect(command.updatedByUserId).toBe('019123ab-cdef-7890-abcd-ef1234567891');
    });

    it('should allow null values for optional fields', () => {
      const command = new UpdateRoleCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        null,
        null,
        '019123ab-cdef-7890-abcd-ef1234567891'
      );

      expect(command.name).toBeNull();
      expect(command.description).toBeNull();
    });
  });
});
