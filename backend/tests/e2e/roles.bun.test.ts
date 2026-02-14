import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Elysia } from 'elysia';
import {
  createTestApp,
  cleanupTestDatabase,
  clearTestDatabase,
  request,
  parseResponse,
  createAdminUser,
  createRegularUser,
  seedRole,
  seedPermission,
  uniqueEmail,
} from './setup.ts';

/**
 * E2E Tests for Role Management Endpoints
 * Tests RoleController functionality including CRUD operations and authorization
 */
describe('Role Management E2E Tests', () => {
  let app: Elysia;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  // ===========================================================================
  // List Roles Tests
  // ===========================================================================
  describe('GET /v1/roles', () => {
    it('should list roles for admin user', async () => {
      const { accessToken } = await createAdminUser(app);

      // Create some roles to list
      await seedRole('editor', 'Can edit content');
      await seedRole('viewer', 'Can view content');

      const response = await request(app, 'GET', '/v1/roles', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        data: { roles: any[]; total: number };
      }>(response);

      expect(body.success).toBe(true);
      // Should have admin (seeded), editor, and viewer roles
      expect(body.data.roles.length).toBeGreaterThanOrEqual(3);
    });

    it('should reject non-admin user', async () => {
      const { accessToken } = await createRegularUser(app);

      const response = await request(app, 'GET', '/v1/roles', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        error: string;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(403);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app, 'GET', '/v1/roles');

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        error: string;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(401);
    });

    it('should support pagination', async () => {
      const { accessToken } = await createAdminUser(app);

      // Create multiple roles
      for (let i = 1; i <= 5; i++) {
        await seedRole(`role_${i}`, `Test role ${i}`);
      }

      const response = await request(app, 'GET', '/v1/roles?page=1&limit=3', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await parseResponse<{
        success: boolean;
        data: any;
      }>(response);

      expect(body.success).toBe(true);
    });
  });

  // ===========================================================================
  // Create Role Tests
  // ===========================================================================
  describe('POST /v1/roles', () => {
    it('should create a new role as admin', async () => {
      const { accessToken } = await createAdminUser(app);

      const response = await request(app, 'POST', '/v1/roles', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { name: 'moderator', description: 'Content moderator' },
      });

      expect(response.status).toBe(201);

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        data: {
          id: string;
          name: string;
          description: string;
          isSystem: boolean;
        };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.name).toBe('moderator');
      expect(body.data.description).toBe('Content moderator');
      expect(body.data.isSystem).toBe(false);
    });

    it('should reject duplicate role name', async () => {
      const { accessToken } = await createAdminUser(app);

      // Create first role
      await request(app, 'POST', '/v1/roles', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { name: 'unique_role' },
      });

      // Try to create duplicate
      const response = await request(app, 'POST', '/v1/roles', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { name: 'unique_role' },
      });

      const body = await parseResponse<{
        success: boolean;
        error: string;
      }>(response);

      expect(body.success).toBe(false);
    });

    it('should reject non-admin user', async () => {
      const { accessToken } = await createRegularUser(app);

      const response = await request(app, 'POST', '/v1/roles', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { name: 'newrole' },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(403);
    });
  });

  // ===========================================================================
  // Update Role Tests
  // ===========================================================================
  describe('PUT /v1/roles/:roleId', () => {
    it('should update role description as admin', async () => {
      const { accessToken } = await createAdminUser(app);
      const roleId = await seedRole('updateable', 'Original description');

      const response = await request(app, 'PUT', `/v1/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { description: 'Updated description' },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        success: boolean;
        data: { description: string };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.description).toBe('Updated description');
    });

    it('should update role name (non-system role)', async () => {
      const { accessToken } = await createAdminUser(app);
      const roleId = await seedRole('oldname', 'Some role');

      const response = await request(app, 'PUT', `/v1/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { name: 'newname' },
      });

      const body = await parseResponse<{
        success: boolean;
        data: { name: string };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.name).toBe('newname');
    });

    it('should reject non-admin user', async () => {
      const { accessToken } = await createRegularUser(app);
      const roleId = await seedRole('testrole');

      const response = await request(app, 'PUT', `/v1/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { description: 'Hacked!' },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(403);
    });
  });

  // ===========================================================================
  // Delete Role Tests
  // ===========================================================================
  describe('DELETE /v1/roles/:roleId', () => {
    it('should delete non-system role as admin', async () => {
      const { accessToken } = await createAdminUser(app);
      const roleId = await seedRole('deletable', 'Can be deleted');

      const response = await request(app, 'DELETE', `/v1/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        success: boolean;
        message: string;
      }>(response);

      expect(body.success).toBe(true);
      expect(body.message).toContain('deleted');
    });

    it('should reject deleting system role (admin)', async () => {
      const { accessToken, roleId: adminRoleId } = await createAdminUser(app);

      const response = await request(app, 'DELETE', `/v1/roles/${adminRoleId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await parseResponse<{
        success: boolean;
        error: string;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.error.toLowerCase()).toContain('system');
    });

    it('should reject non-admin user', async () => {
      const { accessToken } = await createRegularUser(app);
      const roleId = await seedRole('protected');

      const response = await request(app, 'DELETE', `/v1/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(403);
    });
  });

  // ===========================================================================
  // User Role Management Tests
  // ===========================================================================
  describe('GET /v1/users/:userId/roles', () => {
    it('should return user roles for admin', async () => {
      const { accessToken: adminToken } = await createAdminUser(app);
      const { userId } = await createRegularUser(app);

      const response = await request(app, 'GET', `/v1/users/${userId}/roles`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        success: boolean;
        data: string[];
      }>(response);

      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('should allow user to see their own roles', async () => {
      const { accessToken, userId } = await createRegularUser(app);

      const response = await request(app, 'GET', `/v1/users/${userId}/roles`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        success: boolean;
      }>(response);

      expect(body.success).toBe(true);
    });

    it('should reject user viewing other users roles', async () => {
      const { accessToken } = await createRegularUser(app);
      const { userId: otherUserId } = await createRegularUser(
        app,
        uniqueEmail(),
        'OtherP@ss123'
      );

      const response = await request(app, 'GET', `/v1/users/${otherUserId}/roles`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(403);
    });
  });

  describe('POST /v1/users/:userId/roles', () => {
    it('should assign role to user as admin', async () => {
      const { accessToken: adminToken } = await createAdminUser(app);
      const { userId } = await createRegularUser(app);
      await seedRole('editor');

      const response = await request(app, 'POST', `/v1/users/${userId}/roles`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { role: 'editor' },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        success: boolean;
        message: string;
      }>(response);

      expect(body.success).toBe(true);
      expect(body.message).toContain('editor');
    });

    it('should reject non-admin user', async () => {
      const { accessToken, userId } = await createRegularUser(app);
      await seedRole('editor');

      const response = await request(app, 'POST', `/v1/users/${userId}/roles`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { role: 'editor' },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(403);
    });
  });

  describe('DELETE /v1/users/:userId/roles/:role', () => {
    it('should remove role from user as admin', async () => {
      const { accessToken: adminToken } = await createAdminUser(app);
      const { userId } = await createRegularUser(app);
      await seedRole('temporary');
      await seedRole('keeper'); // User needs at least one role remaining

      // Assign both roles to user
      await request(app, 'POST', `/v1/users/${userId}/roles`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { role: 'keeper' },
      });
      await request(app, 'POST', `/v1/users/${userId}/roles`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { role: 'temporary' },
      });

      // Now we can remove 'temporary' since 'keeper' remains
      const response = await request(app, 'DELETE', `/v1/users/${userId}/roles/temporary`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        success: boolean;
        message: string;
      }>(response);

      expect(body.success).toBe(true);
    });

    it('should reject removing non-existent role', async () => {
      const { accessToken: adminToken } = await createAdminUser(app);
      const { userId } = await createRegularUser(app);

      const response = await request(app, 'DELETE', `/v1/users/${userId}/roles/nonexistent`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const body = await parseResponse<{
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
    });
  });

  // ===========================================================================
  // Role Permission Management Tests
  // ===========================================================================
  describe('POST /v1/roles/:roleId/permissions', () => {
    it('should assign permission to role as admin', async () => {
      const { accessToken } = await createAdminUser(app);
      const roleId = await seedRole('permissioned');
      await seedPermission('posts:read', 'Read posts');

      const response = await request(app, 'POST', `/v1/roles/${roleId}/permissions`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { permission: 'posts:read' },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        success: boolean;
        message: string;
      }>(response);

      expect(body.success).toBe(true);
      expect(body.message).toContain('posts:read');
    });

    it('should reject non-admin user', async () => {
      const { accessToken } = await createRegularUser(app);
      const roleId = await seedRole('testrole');
      await seedPermission('posts:write');

      const response = await request(app, 'POST', `/v1/roles/${roleId}/permissions`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { permission: 'posts:write' },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(403);
    });
  });

  describe('DELETE /v1/roles/:roleId/permissions/:permission', () => {
    it('should remove permission from role as admin', async () => {
      const { accessToken } = await createAdminUser(app);
      const roleId = await seedRole('permsrole');
      await seedPermission('posts:delete');

      // Assign permission first
      await request(app, 'POST', `/v1/roles/${roleId}/permissions`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { permission: 'posts:delete' },
      });

      // Remove permission
      const response = await request(
        app,
        'DELETE',
        `/v1/roles/${roleId}/permissions/posts:delete`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        success: boolean;
        message: string;
      }>(response);

      expect(body.success).toBe(true);
    });
  });
});
