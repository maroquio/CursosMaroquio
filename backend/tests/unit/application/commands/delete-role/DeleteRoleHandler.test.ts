import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteRoleHandler } from '@auth/application/commands/delete-role/DeleteRoleHandler.ts';
import { DeleteRoleCommand } from '@auth/application/commands/delete-role/DeleteRoleCommand.ts';
import {
  MockUserRepository,
  MockRoleRepository,
  createTestAdmin,
  createTestUser,
  createTestRole,
} from '../../mocks/index.ts';

describe('DeleteRoleHandler', () => {
  let handler: DeleteRoleHandler;
  let userRepository: MockUserRepository;
  let roleRepository: MockRoleRepository;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    roleRepository = new MockRoleRepository();
    handler = new DeleteRoleHandler(userRepository, roleRepository);
  });

  describe('successful role deletion', () => {
    it('should delete a role when admin requests it', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const role = createTestRole('editor', 'Editor role', false);
      roleRepository.addRole(role);

      const command = new DeleteRoleCommand(
        role.id.toValue(),
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
    });

    it('should remove role from repository', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const role = createTestRole('reviewer', null, false);
      roleRepository.addRole(role);

      expect(roleRepository.getAll().length).toBe(1);

      const command = new DeleteRoleCommand(
        role.id.toValue(),
        admin.getId().toValue()
      );

      await handler.execute(command);

      expect(roleRepository.getAll().length).toBe(0);
    });
  });

  describe('authorization failures', () => {
    it('should fail when deleter is not an admin', async () => {
      const regularUser = createTestUser();
      userRepository.addUser(regularUser);

      const role = createTestRole('editor', null, false);
      roleRepository.addRole(role);

      const command = new DeleteRoleCommand(
        role.id.toValue(),
        regularUser.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('administrators');
    });

    it('should fail when deleter is not found', async () => {
      const role = createTestRole('editor', null, false);
      roleRepository.addRole(role);

      const command = new DeleteRoleCommand(
        role.id.toValue(),
        '019123ab-cdef-7890-abcd-ef1234567890'
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('not found');
    });

    it('should fail with invalid deleter user ID format', async () => {
      const command = new DeleteRoleCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
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

      const command = new DeleteRoleCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Role not found');
    });

    it('should fail with invalid role ID format', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new DeleteRoleCommand(
        'invalid-role-id',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Invalid role ID');
    });

    it('should fail when trying to delete a system role', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      // Create a system role (isSystem = true)
      const systemRole = createTestRole('admin', 'Admin role', true);
      roleRepository.addRole(systemRole);

      const command = new DeleteRoleCommand(
        systemRole.id.toValue(),
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('System roles cannot be deleted');
    });
  });

  describe('command properties', () => {
    it('should correctly store command properties', () => {
      const command = new DeleteRoleCommand(
        '019123ab-cdef-7890-abcd-ef1234567890',
        '019123ab-cdef-7890-abcd-ef1234567891'
      );

      expect(command.roleId).toBe('019123ab-cdef-7890-abcd-ef1234567890');
      expect(command.deletedByUserId).toBe('019123ab-cdef-7890-abcd-ef1234567891');
    });
  });
});
