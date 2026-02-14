import { describe, it, expect, beforeEach } from 'vitest';
import { UserCreated } from '@auth/domain/events/UserCreated.ts';
import { RoleCreated } from '@auth/domain/events/RoleCreated.ts';
import { RoleUpdated } from '@auth/domain/events/RoleUpdated.ts';
import { RoleDeleted } from '@auth/domain/events/RoleDeleted.ts';
import { RoleAssigned } from '@auth/domain/events/RoleAssigned.ts';
import { RoleRemoved } from '@auth/domain/events/RoleRemoved.ts';
import { PermissionAssignedToUser } from '@auth/domain/events/PermissionAssignedToUser.ts';
import { PermissionRemovedFromUser } from '@auth/domain/events/PermissionRemovedFromUser.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { Email } from '@auth/domain/value-objects/Email.ts';
import { Role } from '@auth/domain/value-objects/Role.ts';
import { RoleId } from '@auth/domain/value-objects/RoleId.ts';
import { Permission } from '@auth/domain/value-objects/Permission.ts';

describe('Domain Events', () => {
  let testUserId: UserId;
  let testEmail: Email;
  let testRole: Role;
  let testRoleId: RoleId;
  let testPermission: Permission;
  let assignedByUserId: UserId;

  beforeEach(() => {
    testUserId = UserId.create();
    testEmail = Email.create('test@example.com').getValue();
    testRole = Role.create('editor').getValue();
    testRoleId = RoleId.create();
    testPermission = Permission.create('posts:read').getValue();
    assignedByUserId = UserId.create();
  });

  describe('UserCreated', () => {
    it('should create event with userId and email', () => {
      const event = new UserCreated(testUserId, testEmail);

      expect(event.userId).toBe(testUserId);
      expect(event.email).toBe(testEmail);
    });

    it('should return userId as aggregateId', () => {
      const event = new UserCreated(testUserId, testEmail);

      expect(event.getAggregateId()).toBe(testUserId.toValue());
    });

    it('should return correct event type', () => {
      const event = new UserCreated(testUserId, testEmail);

      expect(event.getEventType()).toBe('UserCreated');
    });

    it('should set occurredAt timestamp', () => {
      const before = new Date();
      const event = new UserCreated(testUserId, testEmail);
      const after = new Date();

      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('RoleCreated', () => {
    it('should create event with roleId, name and description', () => {
      const event = new RoleCreated(testRoleId, 'editor', 'Editor role');

      expect(event.roleId).toBe(testRoleId);
      expect(event.name).toBe('editor');
      expect(event.description).toBe('Editor role');
    });

    it('should allow null description', () => {
      const event = new RoleCreated(testRoleId, 'editor', null);

      expect(event.description).toBeNull();
    });

    it('should allow optional createdBy', () => {
      const event = new RoleCreated(testRoleId, 'editor', null, assignedByUserId);

      expect(event.createdBy).toBe(assignedByUserId);
    });

    it('should create event without createdBy', () => {
      const event = new RoleCreated(testRoleId, 'editor', null);

      expect(event.createdBy).toBeUndefined();
    });

    it('should return roleId as aggregateId', () => {
      const event = new RoleCreated(testRoleId, 'editor', null);

      expect(event.getAggregateId()).toBe(testRoleId.toValue());
    });

    it('should return correct event type', () => {
      const event = new RoleCreated(testRoleId, 'editor', null);

      expect(event.getEventType()).toBe('RoleCreated');
    });

    it('should set occurredAt timestamp', () => {
      const event = new RoleCreated(testRoleId, 'editor', null);

      expect(event.occurredAt).toBeInstanceOf(Date);
    });
  });

  describe('RoleUpdated', () => {
    it('should create event with roleId and optional fields', () => {
      const event = new RoleUpdated(testRoleId, 'new-name', 'New description');

      expect(event.roleId).toBe(testRoleId);
      expect(event.name).toBe('new-name');
      expect(event.description).toBe('New description');
    });

    it('should allow undefined name and description', () => {
      const event = new RoleUpdated(testRoleId);

      expect(event.name).toBeUndefined();
      expect(event.description).toBeUndefined();
    });

    it('should allow null description', () => {
      const event = new RoleUpdated(testRoleId, 'name', null);

      expect(event.description).toBeNull();
    });

    it('should allow optional updatedBy', () => {
      const event = new RoleUpdated(testRoleId, 'name', null, assignedByUserId);

      expect(event.updatedBy).toBe(assignedByUserId);
    });

    it('should return roleId as aggregateId', () => {
      const event = new RoleUpdated(testRoleId);

      expect(event.getAggregateId()).toBe(testRoleId.toValue());
    });

    it('should return correct event type', () => {
      const event = new RoleUpdated(testRoleId);

      expect(event.getEventType()).toBe('RoleUpdated');
    });

    it('should set occurredAt timestamp', () => {
      const event = new RoleUpdated(testRoleId);

      expect(event.occurredAt).toBeInstanceOf(Date);
    });
  });

  describe('RoleDeleted', () => {
    it('should create event with roleId and name', () => {
      const event = new RoleDeleted(testRoleId, 'editor');

      expect(event.roleId).toBe(testRoleId);
      expect(event.name).toBe('editor');
    });

    it('should allow optional deletedBy', () => {
      const event = new RoleDeleted(testRoleId, 'editor', assignedByUserId);

      expect(event.deletedBy).toBe(assignedByUserId);
    });

    it('should create event without deletedBy', () => {
      const event = new RoleDeleted(testRoleId, 'editor');

      expect(event.deletedBy).toBeUndefined();
    });

    it('should return roleId as aggregateId', () => {
      const event = new RoleDeleted(testRoleId, 'editor');

      expect(event.getAggregateId()).toBe(testRoleId.toValue());
    });

    it('should return correct event type', () => {
      const event = new RoleDeleted(testRoleId, 'editor');

      expect(event.getEventType()).toBe('RoleDeleted');
    });

    it('should set occurredAt timestamp', () => {
      const event = new RoleDeleted(testRoleId, 'editor');

      expect(event.occurredAt).toBeInstanceOf(Date);
    });
  });

  describe('RoleAssigned', () => {
    it('should create event with userId and role', () => {
      const event = new RoleAssigned(testUserId, testRole);

      expect(event.userId).toBe(testUserId);
      expect(event.role).toBe(testRole);
    });

    it('should allow optional assignedBy', () => {
      const event = new RoleAssigned(testUserId, testRole, assignedByUserId);

      expect(event.assignedBy).toBe(assignedByUserId);
    });

    it('should create event without assignedBy', () => {
      const event = new RoleAssigned(testUserId, testRole);

      expect(event.assignedBy).toBeUndefined();
    });

    it('should return userId as aggregateId', () => {
      const event = new RoleAssigned(testUserId, testRole);

      expect(event.getAggregateId()).toBe(testUserId.toValue());
    });

    it('should return correct event type', () => {
      const event = new RoleAssigned(testUserId, testRole);

      expect(event.getEventType()).toBe('RoleAssigned');
    });

    it('should set occurredAt timestamp', () => {
      const event = new RoleAssigned(testUserId, testRole);

      expect(event.occurredAt).toBeInstanceOf(Date);
    });
  });

  describe('RoleRemoved', () => {
    it('should create event with userId and role', () => {
      const event = new RoleRemoved(testUserId, testRole);

      expect(event.userId).toBe(testUserId);
      expect(event.role).toBe(testRole);
    });

    it('should allow optional removedBy', () => {
      const event = new RoleRemoved(testUserId, testRole, assignedByUserId);

      expect(event.removedBy).toBe(assignedByUserId);
    });

    it('should create event without removedBy', () => {
      const event = new RoleRemoved(testUserId, testRole);

      expect(event.removedBy).toBeUndefined();
    });

    it('should return userId as aggregateId', () => {
      const event = new RoleRemoved(testUserId, testRole);

      expect(event.getAggregateId()).toBe(testUserId.toValue());
    });

    it('should return correct event type', () => {
      const event = new RoleRemoved(testUserId, testRole);

      expect(event.getEventType()).toBe('RoleRemoved');
    });

    it('should set occurredAt timestamp', () => {
      const event = new RoleRemoved(testUserId, testRole);

      expect(event.occurredAt).toBeInstanceOf(Date);
    });
  });

  describe('PermissionAssignedToUser', () => {
    it('should create event with userId and permission', () => {
      const event = new PermissionAssignedToUser(testUserId, testPermission);

      expect(event.userId).toBe(testUserId);
      expect(event.permission).toBe(testPermission);
    });

    it('should allow optional assignedBy', () => {
      const event = new PermissionAssignedToUser(testUserId, testPermission, assignedByUserId);

      expect(event.assignedBy).toBe(assignedByUserId);
    });

    it('should create event without assignedBy', () => {
      const event = new PermissionAssignedToUser(testUserId, testPermission);

      expect(event.assignedBy).toBeUndefined();
    });

    it('should return userId as aggregateId', () => {
      const event = new PermissionAssignedToUser(testUserId, testPermission);

      expect(event.getAggregateId()).toBe(testUserId.toValue());
    });

    it('should return correct event type', () => {
      const event = new PermissionAssignedToUser(testUserId, testPermission);

      expect(event.getEventType()).toBe('PermissionAssignedToUser');
    });

    it('should set occurredAt timestamp', () => {
      const event = new PermissionAssignedToUser(testUserId, testPermission);

      expect(event.occurredAt).toBeInstanceOf(Date);
    });
  });

  describe('PermissionRemovedFromUser', () => {
    it('should create event with userId and permission', () => {
      const event = new PermissionRemovedFromUser(testUserId, testPermission);

      expect(event.userId).toBe(testUserId);
      expect(event.permission).toBe(testPermission);
    });

    it('should allow optional removedBy', () => {
      const event = new PermissionRemovedFromUser(testUserId, testPermission, assignedByUserId);

      expect(event.removedBy).toBe(assignedByUserId);
    });

    it('should create event without removedBy', () => {
      const event = new PermissionRemovedFromUser(testUserId, testPermission);

      expect(event.removedBy).toBeUndefined();
    });

    it('should return userId as aggregateId', () => {
      const event = new PermissionRemovedFromUser(testUserId, testPermission);

      expect(event.getAggregateId()).toBe(testUserId.toValue());
    });

    it('should return correct event type', () => {
      const event = new PermissionRemovedFromUser(testUserId, testPermission);

      expect(event.getEventType()).toBe('PermissionRemovedFromUser');
    });

    it('should set occurredAt timestamp', () => {
      const event = new PermissionRemovedFromUser(testUserId, testPermission);

      expect(event.occurredAt).toBeInstanceOf(Date);
    });
  });
});
