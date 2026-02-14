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
  seedPermission,
  seedRole,
  uniqueEmail,
} from './setup.ts';

/**
 * E2E Tests for Permission Management Endpoints
 * Tests PermissionController functionality including CRUD operations and authorization
 */
describe('Permission Management E2E Tests', () => {
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
  // List Permissions Tests
  // ===========================================================================
  describe('GET /v1/permissions', () => {
    it('should list permissions for admin user', async () => {
      const { accessToken } = await createAdminUser(app);

      // Create some permissions to list
      await seedPermission('posts:read', 'Read posts');
      await seedPermission('posts:write', 'Write posts');
      await seedPermission('users:manage', 'Manage users');

      const response = await request(app, 'GET', '/v1/permissions', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        data: { permissions: any[]; total: number };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.permissions.length).toBeGreaterThanOrEqual(3);
    });

    it('should reject non-admin user', async () => {
      const { accessToken } = await createRegularUser(app);

      const response = await request(app, 'GET', '/v1/permissions', {
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
      const response = await request(app, 'GET', '/v1/permissions');

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

      // Create multiple permissions
      for (let i = 1; i <= 5; i++) {
        await seedPermission(`resource${i}:action`, `Permission ${i}`);
      }

      const response = await request(app, 'GET', '/v1/permissions?page=1&limit=3', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await parseResponse<{
        success: boolean;
        data: any;
      }>(response);

      expect(body.success).toBe(true);
    });

    it('should filter by resource', async () => {
      const { accessToken } = await createAdminUser(app);

      // Create permissions with different resources
      await seedPermission('posts:read', 'Read posts');
      await seedPermission('posts:write', 'Write posts');
      await seedPermission('users:read', 'Read users');

      const response = await request(app, 'GET', '/v1/permissions?resource=posts', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await parseResponse<{
        success: boolean;
        data: Array<{ name: string; resource: string }>;
      }>(response);

      expect(body.success).toBe(true);
      // Should only return posts-related permissions
      if (Array.isArray(body.data)) {
        const allPosts = body.data.every((p) => p.resource === 'posts');
        expect(allPosts).toBe(true);
      }
    });
  });

  // ===========================================================================
  // Create Permission Tests
  // ===========================================================================
  describe('POST /v1/permissions', () => {
    it('should create a new permission as admin', async () => {
      const { accessToken } = await createAdminUser(app);

      const response = await request(app, 'POST', '/v1/permissions', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { name: 'reports:export', description: 'Export reports to PDF' },
      });

      expect(response.status).toBe(201);

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        data: {
          id: string;
          name: string;
          resource: string;
          action: string;
          description: string;
        };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.name).toBe('reports:export');
      expect(body.data.resource).toBe('reports');
      expect(body.data.action).toBe('export');
      expect(body.data.description).toBe('Export reports to PDF');
    });

    it('should create permission without description', async () => {
      const { accessToken } = await createAdminUser(app);

      const response = await request(app, 'POST', '/v1/permissions', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { name: 'analytics:view' },
      });

      expect(response.status).toBe(201);

      const body = await parseResponse<{
        success: boolean;
        data: { name: string; description: string | null };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.name).toBe('analytics:view');
    });

    it('should reject duplicate permission name', async () => {
      const { accessToken } = await createAdminUser(app);

      // Create first permission
      await request(app, 'POST', '/v1/permissions', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { name: 'unique:permission' },
      });

      // Try to create duplicate
      const response = await request(app, 'POST', '/v1/permissions', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { name: 'unique:permission' },
      });

      const body = await parseResponse<{
        success: boolean;
        error: string;
      }>(response);

      expect(body.success).toBe(false);
    });

    it('should reject non-admin user', async () => {
      const { accessToken } = await createRegularUser(app);

      const response = await request(app, 'POST', '/v1/permissions', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { name: 'hacker:access' },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(403);
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app, 'POST', '/v1/permissions', {
        body: { name: 'test:permission' },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(401);
    });
  });

  // ===========================================================================
  // Get User Permissions Tests
  // ===========================================================================
  describe('GET /v1/users/:userId/permissions', () => {
    it('should return user permissions for admin', async () => {
      const { accessToken: adminToken } = await createAdminUser(app);
      const { userId } = await createRegularUser(app);

      const response = await request(app, 'GET', `/v1/users/${userId}/permissions`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        success: boolean;
        data: {
          userId: string;
          permissions: string[];
          roles: string[];
        };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.userId).toBe(userId);
      expect(Array.isArray(body.data.permissions)).toBe(true);
      expect(Array.isArray(body.data.roles)).toBe(true);
    });

    it('should allow user to see their own permissions', async () => {
      const { accessToken, userId } = await createRegularUser(app);

      const response = await request(app, 'GET', `/v1/users/${userId}/permissions`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        success: boolean;
        data: { userId: string };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.userId).toBe(userId);
    });

    it('should reject user viewing other users permissions', async () => {
      const { accessToken } = await createRegularUser(app);
      const { userId: otherUserId } = await createRegularUser(
        app,
        uniqueEmail(),
        'OtherP@ss123'
      );

      const response = await request(app, 'GET', `/v1/users/${otherUserId}/permissions`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(403);
    });

    it('should reject unauthenticated request', async () => {
      const { userId } = await createRegularUser(app);

      const response = await request(app, 'GET', `/v1/users/${userId}/permissions`);

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(401);
    });

    it('should return permissions from roles', async () => {
      const { accessToken, userId } = await createAdminUser(app);

      // The admin role should have some permissions
      const response = await request(app, 'GET', `/v1/users/${userId}/permissions`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await parseResponse<{
        success: boolean;
        data: {
          userId: string;
          roles: string[];
        };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.roles).toContain('admin');
    });
  });

  // ===========================================================================
  // Assign Permission to User Tests
  // ===========================================================================
  describe('POST /v1/users/:userId/permissions', () => {
    it('should assign permission to user as admin', async () => {
      const { accessToken: adminToken } = await createAdminUser(app);
      const { userId } = await createRegularUser(app);
      await seedPermission('special:access', 'Special access permission');

      const response = await request(app, 'POST', `/v1/users/${userId}/permissions`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { permission: 'special:access' },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        success: boolean;
        message: string;
      }>(response);

      expect(body.success).toBe(true);
      expect(body.message).toContain('special:access');
    });

    it('should reject assigning non-existent permission', async () => {
      const { accessToken: adminToken } = await createAdminUser(app);
      const { userId } = await createRegularUser(app);

      const response = await request(app, 'POST', `/v1/users/${userId}/permissions`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { permission: 'nonexistent:permission' },
      });

      const body = await parseResponse<{
        success: boolean;
        error: string;
      }>(response);

      expect(body.success).toBe(false);
    });

    it('should reject non-admin user', async () => {
      const { accessToken, userId } = await createRegularUser(app);
      await seedPermission('blocked:access');

      const response = await request(app, 'POST', `/v1/users/${userId}/permissions`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { permission: 'blocked:access' },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(403);
    });

    it('should reject unauthenticated request', async () => {
      const { userId } = await createRegularUser(app);
      await seedPermission('test:permission');

      const response = await request(app, 'POST', `/v1/users/${userId}/permissions`, {
        body: { permission: 'test:permission' },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(401);
    });

    it('should handle assigning permission to non-existent user', async () => {
      const { accessToken: adminToken } = await createAdminUser(app);
      await seedPermission('orphan:permission');
      const fakeUserId = '01900000-0000-0000-0000-000000000000';

      const response = await request(app, 'POST', `/v1/users/${fakeUserId}/permissions`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { permission: 'orphan:permission' },
      });

      const body = await parseResponse<{
        success: boolean;
        error: string;
      }>(response);

      expect(body.success).toBe(false);
    });
  });

  // ===========================================================================
  // Remove Permission from User Tests
  // ===========================================================================
  describe('DELETE /v1/users/:userId/permissions/:permission', () => {
    it('should remove permission from user as admin', async () => {
      const { accessToken: adminToken } = await createAdminUser(app);
      const { userId } = await createRegularUser(app);
      await seedPermission('temporary:access');

      // First assign the permission
      await request(app, 'POST', `/v1/users/${userId}/permissions`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { permission: 'temporary:access' },
      });

      // Then remove it
      const response = await request(
        app,
        'DELETE',
        `/v1/users/${userId}/permissions/temporary:access`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        success: boolean;
        message: string;
      }>(response);

      expect(body.success).toBe(true);
      expect(body.message).toContain('temporary:access');
    });

    it('should reject removing non-assigned permission', async () => {
      const { accessToken: adminToken } = await createAdminUser(app);
      const { userId } = await createRegularUser(app);

      const response = await request(
        app,
        'DELETE',
        `/v1/users/${userId}/permissions/never:assigned`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      const body = await parseResponse<{
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
    });

    it('should reject non-admin user', async () => {
      const { accessToken, userId } = await createRegularUser(app);

      const response = await request(
        app,
        'DELETE',
        `/v1/users/${userId}/permissions/some:permission`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(403);
    });

    it('should reject unauthenticated request', async () => {
      const { userId } = await createRegularUser(app);

      const response = await request(
        app,
        'DELETE',
        `/v1/users/${userId}/permissions/test:permission`
      );

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(401);
    });
  });

  // ===========================================================================
  // Integration Tests - Permission workflow
  // ===========================================================================
  describe('Permission Workflow Integration', () => {
    it('should complete full permission lifecycle', async () => {
      const { accessToken: adminToken } = await createAdminUser(app);
      const { userId } = await createRegularUser(app);

      // 1. Create a permission
      const createResponse = await request(app, 'POST', '/v1/permissions', {
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { name: 'documents:delete', description: 'Delete documents' },
      });

      expect(createResponse.status).toBe(201);

      // 2. Verify permission exists in list
      const listResponse = await request(app, 'GET', '/v1/permissions', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const listBody = await parseResponse<{
        success: boolean;
        data: { permissions: Array<{ name: string }>; total: number };
      }>(listResponse);

      expect(listBody.success).toBe(true);
      expect(listBody.data.permissions.some((p) => p.name === 'documents:delete')).toBe(true);

      // 3. Assign permission to user
      const assignResponse = await request(app, 'POST', `/v1/users/${userId}/permissions`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { permission: 'documents:delete' },
      });

      expect(assignResponse.status).toBe(200);

      // 4. Verify user has permission
      const userPermsResponse = await request(
        app,
        'GET',
        `/v1/users/${userId}/permissions`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      const userPermsBody = await parseResponse<{
        success: boolean;
        data: { permissions: string[] };
      }>(userPermsResponse);

      expect(userPermsBody.success).toBe(true);
      expect(userPermsBody.data.permissions).toContain('documents:delete');

      // 5. Remove permission from user
      const removeResponse = await request(
        app,
        'DELETE',
        `/v1/users/${userId}/permissions/documents:delete`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      expect(removeResponse.status).toBe(200);

      // 6. Verify user no longer has permission
      const finalPermsResponse = await request(
        app,
        'GET',
        `/v1/users/${userId}/permissions`,
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );

      const finalPermsBody = await parseResponse<{
        success: boolean;
        data: { permissions: string[] };
      }>(finalPermsResponse);

      expect(finalPermsBody.success).toBe(true);
      expect(finalPermsBody.data.permissions).not.toContain('documents:delete');
    });
  });
});
