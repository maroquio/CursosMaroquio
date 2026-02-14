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
  uniqueEmail,
} from './setup.ts';

/**
 * E2E Tests for Admin User Management Endpoints
 * Tests UserAdminController functionality including CRUD, soft delete, and password reset
 */
describe('Admin User Management E2E Tests', () => {
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
  // List Users Tests
  // ===========================================================================
  describe('GET /v1/admin/users', () => {
    it('should list users for admin user', async () => {
      const { accessToken } = await createAdminUser(app);

      // Create some regular users
      await createRegularUser(app, uniqueEmail(), 'UserP@ss123');
      await createRegularUser(app, uniqueEmail(), 'UserP@ss123');

      const response = await request(app, 'GET', '/v1/admin/users', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        data: {
          users: any[];
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>(response);

      expect(body.success).toBe(true);
      // Should have admin + 2 regular users = 3
      expect(body.data.users.length).toBeGreaterThanOrEqual(3);
      expect(body.data.total).toBeGreaterThanOrEqual(3);
    });

    it('should reject non-admin user', async () => {
      const { accessToken } = await createRegularUser(app);

      const response = await request(app, 'GET', '/v1/admin/users', {
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
      const response = await request(app, 'GET', '/v1/admin/users');

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

      // Create multiple users
      for (let i = 0; i < 5; i++) {
        await createRegularUser(app, uniqueEmail(), 'UserP@ss123');
      }

      const response = await request(app, 'GET', '/v1/admin/users?page=1&limit=3', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await parseResponse<{
        success: boolean;
        data: { users: any[]; total: number; page: number; limit: number; totalPages: number };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.users.length).toBeLessThanOrEqual(3);
      expect(body.data.page).toBe(1);
      expect(body.data.limit).toBe(3);
      expect(body.data.totalPages).toBeGreaterThan(1);
    });

    it('should filter by isActive status', async () => {
      const { accessToken } = await createAdminUser(app);

      // Create a user and then deactivate them
      const { userId } = await createRegularUser(app, uniqueEmail(), 'UserP@ss123');
      await request(app, 'DELETE', `/v1/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Get only active users
      const response = await request(app, 'GET', '/v1/admin/users?isActive=true', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await parseResponse<{
        success: boolean;
        data: { users: any[] };
      }>(response);

      expect(body.success).toBe(true);
      // All returned users should be active
      body.data.users.forEach((user: any) => {
        expect(user.isActive).toBe(true);
      });
    });
  });

  // ===========================================================================
  // Get User by ID Tests
  // ===========================================================================
  describe('GET /v1/admin/users/:userId', () => {
    it('should return user by ID for admin', async () => {
      const { accessToken } = await createAdminUser(app);
      const { userId } = await createRegularUser(app, uniqueEmail(), 'UserP@ss123');

      const response = await request(app, 'GET', `/v1/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        data: {
          id: string;
          email: string;
          isActive: boolean;
          roles: string[];
          individualPermissions: string[];
          createdAt: string;
        };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.id).toBe(userId);
      expect(body.data.isActive).toBe(true);
      expect(Array.isArray(body.data.roles)).toBe(true);
    });

    it('should return error for non-existent user', async () => {
      const { accessToken } = await createAdminUser(app);

      const response = await request(
        app,
        'GET',
        '/v1/admin/users/019b16e0-3678-7519-82de-a0516bdd7c2d',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        error: string;
      }>(response);

      expect(body.success).toBe(false);
      // Returns 404 for not found
      expect(body.statusCode).toBe(404);
    });

    it('should reject non-admin user', async () => {
      const { accessToken, userId } = await createRegularUser(app);

      const response = await request(app, 'GET', `/v1/admin/users/${userId}`, {
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
  // Create User Tests
  // ===========================================================================
  describe('POST /v1/admin/users', () => {
    it('should create a new user as admin', async () => {
      const { accessToken } = await createAdminUser(app);
      const newEmail = uniqueEmail();

      const response = await request(app, 'POST', '/v1/admin/users', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: {
          email: newEmail,
          password: 'NewUserP@ss123',
          fullName: 'New User',
          phone: '11999995555',
        },
      });

      expect(response.status).toBe(201);

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        data: {
          id: string;
          email: string;
          isActive: boolean;
          roles: string[];
        };
        message: string;
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.email).toBe(newEmail);
      expect(body.data.isActive).toBe(true);
      expect(body.message).toBeDefined();
    });

    it('should create user with specified roles', async () => {
      const { accessToken } = await createAdminUser(app);
      await seedRole('editor', 'Editor role');
      const newEmail = uniqueEmail();

      const response = await request(app, 'POST', '/v1/admin/users', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: {
          email: newEmail,
          password: 'NewUserP@ss123',
          fullName: 'New Editor',
          phone: '11999994444',
          roles: ['editor'],
        },
      });

      expect(response.status).toBe(201);

      const body = await parseResponse<{
        success: boolean;
        data: { roles: string[] };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.roles).toContain('editor');
    });

    it('should reject duplicate email', async () => {
      const { accessToken } = await createAdminUser(app);
      const existingEmail = uniqueEmail();

      // Create first user
      await request(app, 'POST', '/v1/admin/users', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { email: existingEmail, password: 'FirstP@ss123', fullName: 'First User', phone: '11999993333' },
      });

      // Try to create second user with same email
      const response = await request(app, 'POST', '/v1/admin/users', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { email: existingEmail, password: 'SecondP@ss456', fullName: 'Second User', phone: '11999992222' },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        error: string;
      }>(response);

      expect(body.success).toBe(false);
      // Controller returns 400 for all handler failures (not 409 specifically for conflict)
      expect(body.statusCode).toBe(400);
    });

    it('should reject weak password', async () => {
      const { accessToken } = await createAdminUser(app);

      const response = await request(app, 'POST', '/v1/admin/users', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { email: uniqueEmail(), password: '123', fullName: 'Test User', phone: '11999991111' },
      });

      // Should fail validation
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject non-admin user', async () => {
      const { accessToken } = await createRegularUser(app);

      const response = await request(app, 'POST', '/v1/admin/users', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { email: uniqueEmail(), password: 'NewP@ss123', fullName: 'New User', phone: '11999990000' },
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
  // Update User Tests
  // ===========================================================================
  describe('PUT /v1/admin/users/:userId', () => {
    it('should update user email as admin', async () => {
      const { accessToken } = await createAdminUser(app);
      const { userId } = await createRegularUser(app, uniqueEmail(), 'UserP@ss123');
      const newEmail = uniqueEmail();

      const response = await request(app, 'PUT', `/v1/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { email: newEmail },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        success: boolean;
        data: { email: string };
        message: string;
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.email).toBe(newEmail);
    });

    it('should reject duplicate email on update', async () => {
      const { accessToken } = await createAdminUser(app);
      const email1 = uniqueEmail();
      const email2 = uniqueEmail();

      // Create two users
      await createRegularUser(app, email1, 'UserP@ss123');
      const { userId: userId2 } = await createRegularUser(app, email2, 'UserP@ss123');

      // Try to update user2 with user1's email
      const response = await request(app, 'PUT', `/v1/admin/users/${userId2}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { email: email1 },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        error: string;
      }>(response);

      expect(body.success).toBe(false);
      // Controller returns 400 for all handler failures (not 409 specifically for conflict)
      expect(body.statusCode).toBe(400);
    });

    it('should return error for non-existent user', async () => {
      const { accessToken } = await createAdminUser(app);

      const response = await request(
        app,
        'PUT',
        '/v1/admin/users/019b16e0-3678-7519-82de-a0516bdd7c2d',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          body: { email: uniqueEmail() },
        }
      );

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
      // Controller returns 400 for all handler failures (not 404 specifically)
      expect(body.statusCode).toBe(400);
    });

    it('should reject non-admin user', async () => {
      const { accessToken, userId } = await createRegularUser(app);

      const response = await request(app, 'PUT', `/v1/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { email: uniqueEmail() },
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
  // Deactivate User (Soft Delete) Tests
  // ===========================================================================
  describe('DELETE /v1/admin/users/:userId', () => {
    it('should deactivate user as admin', async () => {
      const { accessToken } = await createAdminUser(app);
      const { userId } = await createRegularUser(app, uniqueEmail(), 'UserP@ss123');

      const response = await request(app, 'DELETE', `/v1/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        success: boolean;
        message: string;
      }>(response);

      expect(body.success).toBe(true);
      expect(body.message).toBeDefined();
    });

    it('should prevent deactivated user from logging in', async () => {
      const { accessToken } = await createAdminUser(app);
      const userEmail = uniqueEmail();
      const userPassword = 'UserP@ss123';
      const { userId } = await createRegularUser(app, userEmail, userPassword);

      // Deactivate the user
      await request(app, 'DELETE', `/v1/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Try to login as deactivated user
      const loginResponse = await request(app, 'POST', '/v1/auth/login', {
        body: { email: userEmail, password: userPassword },
      });

      const loginBody = await parseResponse<{
        statusCode: number;
        success: boolean;
        error: string;
      }>(loginResponse);

      expect(loginBody.success).toBe(false);
      expect(loginBody.statusCode).toBe(401);
    });

    it('should reject admin deactivating themselves', async () => {
      const { accessToken, userId } = await createAdminUser(app);

      const response = await request(app, 'DELETE', `/v1/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        error: string;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(400);
    });

    it('should reject deactivating already inactive user', async () => {
      const { accessToken } = await createAdminUser(app);
      const { userId } = await createRegularUser(app, uniqueEmail(), 'UserP@ss123');

      // Deactivate first
      await request(app, 'DELETE', `/v1/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Try to deactivate again
      const response = await request(app, 'DELETE', `/v1/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        error: string;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(400);
    });

    it('should return error for non-existent user', async () => {
      const { accessToken } = await createAdminUser(app);

      const response = await request(
        app,
        'DELETE',
        '/v1/admin/users/019b16e0-3678-7519-82de-a0516bdd7c2d',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
      // Controller returns 400 for all handler failures (not 404 specifically)
      expect(body.statusCode).toBe(400);
    });

    it('should reject non-admin user', async () => {
      const { accessToken } = await createRegularUser(app);
      const { userId: targetUserId } = await createRegularUser(
        app,
        uniqueEmail(),
        'TargetP@ss123'
      );

      const response = await request(app, 'DELETE', `/v1/admin/users/${targetUserId}`, {
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
  // Activate User Tests
  // ===========================================================================
  describe('POST /v1/admin/users/:userId/activate', () => {
    it('should activate deactivated user as admin', async () => {
      const { accessToken } = await createAdminUser(app);
      const { userId } = await createRegularUser(app, uniqueEmail(), 'UserP@ss123');

      // Deactivate first
      await request(app, 'DELETE', `/v1/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Activate
      const response = await request(app, 'POST', `/v1/admin/users/${userId}/activate`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        success: boolean;
        message: string;
      }>(response);

      expect(body.success).toBe(true);
      expect(body.message).toBeDefined();
    });

    it('should allow reactivated user to login', async () => {
      const { accessToken } = await createAdminUser(app);
      const userEmail = uniqueEmail();
      const userPassword = 'UserP@ss123';
      const { userId } = await createRegularUser(app, userEmail, userPassword);

      // Deactivate
      await request(app, 'DELETE', `/v1/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Reactivate
      await request(app, 'POST', `/v1/admin/users/${userId}/activate`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      // Try to login
      const loginResponse = await request(app, 'POST', '/v1/auth/login', {
        body: { email: userEmail, password: userPassword },
      });

      const loginBody = await parseResponse<{
        success: boolean;
        data: { accessToken: string };
      }>(loginResponse);

      expect(loginBody.success).toBe(true);
      expect(loginBody.data.accessToken).toBeDefined();
    });

    it('should reject activating already active user', async () => {
      const { accessToken } = await createAdminUser(app);
      const { userId } = await createRegularUser(app, uniqueEmail(), 'UserP@ss123');

      // Try to activate already active user
      const response = await request(app, 'POST', `/v1/admin/users/${userId}/activate`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        error: string;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(400);
    });

    it('should return error for non-existent user', async () => {
      const { accessToken } = await createAdminUser(app);

      const response = await request(
        app,
        'POST',
        '/v1/admin/users/019b16e0-3678-7519-82de-a0516bdd7c2d/activate',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
      // Controller returns 400 for all handler failures (not 404 specifically)
      expect(body.statusCode).toBe(400);
    });

    it('should reject non-admin user', async () => {
      const { accessToken } = await createRegularUser(app);
      const { userId: targetUserId } = await createRegularUser(
        app,
        uniqueEmail(),
        'TargetP@ss123'
      );

      const response = await request(app, 'POST', `/v1/admin/users/${targetUserId}/activate`, {
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
  // Reset Password Tests
  // ===========================================================================
  describe('POST /v1/admin/users/:userId/reset-password', () => {
    it('should reset user password as admin', async () => {
      const { accessToken } = await createAdminUser(app);
      const { userId } = await createRegularUser(app, uniqueEmail(), 'OldP@ss123');

      const response = await request(app, 'POST', `/v1/admin/users/${userId}/reset-password`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { newPassword: 'NewP@ssword456' },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        success: boolean;
        message: string;
      }>(response);

      expect(body.success).toBe(true);
      expect(body.message).toBeDefined();
    });

    it('should allow login with new password after reset', async () => {
      const { accessToken } = await createAdminUser(app);
      const userEmail = uniqueEmail();
      const oldPassword = 'OldP@ss123';
      const newPassword = 'NewP@ssword456';
      const { userId } = await createRegularUser(app, userEmail, oldPassword);

      // Reset password
      await request(app, 'POST', `/v1/admin/users/${userId}/reset-password`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { newPassword },
      });

      // Try login with old password
      const oldLoginResponse = await request(app, 'POST', '/v1/auth/login', {
        body: { email: userEmail, password: oldPassword },
      });

      const oldLoginBody = await parseResponse<{ success: boolean }>(oldLoginResponse);
      expect(oldLoginBody.success).toBe(false);

      // Login with new password
      const newLoginResponse = await request(app, 'POST', '/v1/auth/login', {
        body: { email: userEmail, password: newPassword },
      });

      const newLoginBody = await parseResponse<{
        success: boolean;
        data: { accessToken: string };
      }>(newLoginResponse);

      expect(newLoginBody.success).toBe(true);
      expect(newLoginBody.data.accessToken).toBeDefined();
    });

    it('should reject weak password', async () => {
      const { accessToken } = await createAdminUser(app);
      const { userId } = await createRegularUser(app, uniqueEmail(), 'UserP@ss123');

      const response = await request(app, 'POST', `/v1/admin/users/${userId}/reset-password`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { newPassword: '123' },
      });

      // Should fail validation
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should return error for non-existent user', async () => {
      const { accessToken } = await createAdminUser(app);

      const response = await request(
        app,
        'POST',
        '/v1/admin/users/019b16e0-3678-7519-82de-a0516bdd7c2d/reset-password',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          body: { newPassword: 'NewP@ssword456' },
        }
      );

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
      // Controller returns 400 for all handler failures (not 404 specifically)
      expect(body.statusCode).toBe(400);
    });

    it('should reject non-admin user', async () => {
      const { accessToken } = await createRegularUser(app);
      const { userId: targetUserId } = await createRegularUser(
        app,
        uniqueEmail(),
        'TargetP@ss123'
      );

      const response = await request(
        app,
        'POST',
        `/v1/admin/users/${targetUserId}/reset-password`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          body: { newPassword: 'NewP@ssword456' },
        }
      );

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(403);
    });
  });

  // ===========================================================================
  // Full Admin User Management Flow Tests
  // ===========================================================================
  describe('Full Admin User Management Flow', () => {
    it('should complete full lifecycle: create → update → deactivate → activate → reset password', async () => {
      const { accessToken } = await createAdminUser(app);
      const userEmail = uniqueEmail();
      const initialPassword = 'InitialP@ss123';

      // 1. Create user
      const createResponse = await request(app, 'POST', '/v1/admin/users', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { email: userEmail, password: initialPassword, fullName: 'Lifecycle User', phone: '11999989898' },
      });
      const createBody = await parseResponse<{
        success: boolean;
        data: { id: string };
      }>(createResponse);
      expect(createBody.success).toBe(true);
      const userId = createBody.data.id;

      // 2. Update email
      const newEmail = uniqueEmail();
      const updateResponse = await request(app, 'PUT', `/v1/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { email: newEmail },
      });
      const updateBody = await parseResponse<{
        success: boolean;
        data: { email: string };
      }>(updateResponse);
      expect(updateBody.success).toBe(true);
      expect(updateBody.data.email).toBe(newEmail);

      // 3. Deactivate
      const deactivateResponse = await request(app, 'DELETE', `/v1/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const deactivateBody = await parseResponse<{ success: boolean }>(deactivateResponse);
      expect(deactivateBody.success).toBe(true);

      // 4. Verify cannot login
      const failedLoginResponse = await request(app, 'POST', '/v1/auth/login', {
        body: { email: newEmail, password: initialPassword },
      });
      const failedLoginBody = await parseResponse<{ success: boolean }>(failedLoginResponse);
      expect(failedLoginBody.success).toBe(false);

      // 5. Activate
      const activateResponse = await request(app, 'POST', `/v1/admin/users/${userId}/activate`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const activateBody = await parseResponse<{ success: boolean }>(activateResponse);
      expect(activateBody.success).toBe(true);

      // 6. Reset password
      const newPassword = 'ResetP@ss456';
      const resetResponse = await request(app, 'POST', `/v1/admin/users/${userId}/reset-password`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { newPassword },
      });
      const resetBody = await parseResponse<{ success: boolean }>(resetResponse);
      expect(resetBody.success).toBe(true);

      // 7. Login with new password
      const successLoginResponse = await request(app, 'POST', '/v1/auth/login', {
        body: { email: newEmail, password: newPassword },
      });
      const successLoginBody = await parseResponse<{
        success: boolean;
        data: { accessToken: string };
      }>(successLoginResponse);
      expect(successLoginBody.success).toBe(true);
      expect(successLoginBody.data.accessToken).toBeDefined();
    });
  });
});
