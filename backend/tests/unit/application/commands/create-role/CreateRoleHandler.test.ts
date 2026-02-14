import { describe, it, expect, beforeEach } from 'vitest';
import { CreateRoleHandler } from '@auth/application/commands/create-role/CreateRoleHandler.ts';
import { CreateRoleCommand } from '@auth/application/commands/create-role/CreateRoleCommand.ts';
import {
  MockUserRepository,
  MockRoleRepository,
  createTestAdmin,
  createTestUser,
  createTestRole,
} from '../../mocks/index.ts';

describe('CreateRoleHandler', () => {
  let handler: CreateRoleHandler;
  let userRepository: MockUserRepository;
  let roleRepository: MockRoleRepository;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    roleRepository = new MockRoleRepository();
    handler = new CreateRoleHandler(userRepository, roleRepository);
  });

  describe('successful role creation', () => {
    it('should create a role when admin requests it', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreateRoleCommand(
        'editor',
        'Can edit content',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      const { roleId } = result.getValue();
      expect(roleId).toBeDefined();

      // Verify role was saved correctly in repository
      const saved = roleRepository.getAll();
      expect(saved.length).toBe(1);
      expect(saved[0]!.name).toBe('editor');
      expect(saved[0]!.description).toBe('Can edit content');
      expect(saved[0]!.isSystem).toBe(false);
    });

    it('should save role to repository', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreateRoleCommand(
        'moderator',
        null,
        admin.getId().toValue()
      );

      await handler.execute(command);

      const saved = roleRepository.getAll();
      expect(saved.length).toBe(1);
      expect(saved[0]!.name).toBe('moderator');
    });

    it('should normalize role name to lowercase', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreateRoleCommand(
        'ContentManager',
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      expect(result.getValue().roleId).toBeDefined();

      // Verify normalized name in repository
      const saved = roleRepository.getAll();
      expect(saved[0]!.name).toBe('contentmanager');
    });

    it('should accept roles with underscores', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreateRoleCommand(
        'super_admin',
        'Super administrator',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      expect(result.getValue().roleId).toBeDefined();

      // Verify name in repository
      const saved = roleRepository.getAll();
      expect(saved[0]!.name).toBe('super_admin');
    });

    it('should accept roles with numbers', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreateRoleCommand(
        'tier1_support',
        'First tier support',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isOk).toBe(true);
      expect(result.getValue().roleId).toBeDefined();

      // Verify name in repository
      const saved = roleRepository.getAll();
      expect(saved[0]!.name).toBe('tier1_support');
    });
  });

  describe('authorization failures', () => {
    it('should fail when creator is not an admin', async () => {
      const regularUser = createTestUser();
      userRepository.addUser(regularUser);

      const command = new CreateRoleCommand(
        'editor',
        null,
        regularUser.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('administrators');
    });

    it('should fail when creator is not found', async () => {
      const command = new CreateRoleCommand(
        'editor',
        null,
        '019123ab-cdef-7890-abcd-ef1234567890'
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('not found');
    });

    it('should fail with invalid creator user ID format', async () => {
      const command = new CreateRoleCommand('editor', null, 'invalid-id');

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('Invalid');
    });
  });

  describe('validation failures', () => {
    it('should fail when role already exists', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      // Add existing role
      const existing = createTestRole('editor', 'Editor role');
      roleRepository.addRole(existing);

      const command = new CreateRoleCommand(
        'editor',
        'Another editor',
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('already exists');
    });

    it('should fail with empty role name', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreateRoleCommand('', null, admin.getId().toValue());

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('cannot be empty');
    });

    it('should fail with role name containing spaces', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreateRoleCommand(
        'super admin',
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('lowercase letters');
    });

    it('should fail with role name containing hyphens', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreateRoleCommand(
        'super-admin',
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
    });

    it('should fail with role name starting with number', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreateRoleCommand(
        '1admin',
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
    });

    it('should fail with role name containing special characters', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreateRoleCommand(
        'admin@role',
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
    });

    it('should fail with role name too short', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreateRoleCommand('a', null, admin.getId().toValue());

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('2 characters');
    });

    it('should fail with role name too long', async () => {
      const admin = createTestAdmin();
      userRepository.addUser(admin);

      const command = new CreateRoleCommand(
        'a'.repeat(51),
        null,
        admin.getId().toValue()
      );

      const result = await handler.execute(command);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toContain('50 characters');
    });
  });

  describe('command properties', () => {
    it('should correctly store command properties', () => {
      const command = new CreateRoleCommand(
        'reviewer',
        'Can review content',
        '019123ab-cdef-7890-abcd-ef1234567890'
      );

      expect(command.name).toBe('reviewer');
      expect(command.description).toBe('Can review content');
      expect(command.createdByUserId).toBe('019123ab-cdef-7890-abcd-ef1234567890');
    });

    it('should allow null description', () => {
      const command = new CreateRoleCommand(
        'viewer',
        null,
        '019123ab-cdef-7890-abcd-ef1234567890'
      );

      expect(command.description).toBeNull();
    });
  });
});
