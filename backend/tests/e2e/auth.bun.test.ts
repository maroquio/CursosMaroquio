import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Elysia } from 'elysia';
import {
  createTestApp,
  cleanupTestDatabase,
  clearTestDatabase,
  request,
  parseResponse,
  testUser,
  registerTestUser,
  loginTestUser,
  uniqueEmail,
} from './setup.ts';

/**
 * E2E Tests for Authentication Endpoints
 */
describe('Auth Endpoints E2E Tests', () => {
  let app: Elysia;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Clear database before each test for isolation
    await clearTestDatabase();
  });

  // ===========================================================================
  // Registration Tests
  // ===========================================================================
  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const email = uniqueEmail();
      const response = await request(app, 'POST', '/v1/auth/register', {
        body: { email, password: 'SecureP@ss123', fullName: 'Test User', phone: '11999998888' },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        message: string;
      }>(response);

      expect(body.success).toBe(true);
      expect(body.statusCode).toBe(201);
      expect(body.message).toBe('User registered successfully');
    });

    it('should reject duplicate email', async () => {
      const email = uniqueEmail();

      // Register first user
      await request(app, 'POST', '/v1/auth/register', {
        body: { email, password: 'SecureP@ss123', fullName: 'Test User', phone: '11999998888' },
      });

      // Try to register same email
      const response = await request(app, 'POST', '/v1/auth/register', {
        body: { email, password: 'DifferentP@ss456', fullName: 'Test User', phone: '11999998888' },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        error: string;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.error).toContain('already exists');
    });

    it('should reject weak password', async () => {
      const response = await request(app, 'POST', '/v1/auth/register', {
        body: { email: uniqueEmail(), password: '123456', fullName: 'Test User', phone: '11999998888' }, // Too weak (< 8 chars)
      });

      // Validation error can come from Elysia (status 422) or app logic
      // Either way, the request should fail
      expect(response.status >= 400).toBe(true);
    });

    it('should reject invalid email format', async () => {
      const response = await request(app, 'POST', '/v1/auth/register', {
        body: { email: 'not-an-email', password: 'SecureP@ss123', fullName: 'Test User', phone: '11999998888' },
      });

      const body = await parseResponse<any>(response);

      // Either validation error or domain error
      expect(body.success === false || response.status >= 400).toBe(true);
    });

    it('should reject empty body', async () => {
      const response = await request(app, 'POST', '/v1/auth/register', {
        body: {},
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  // ===========================================================================
  // Login Tests
  // ===========================================================================
  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const email = uniqueEmail();
      const password = 'SecureP@ss123';

      // Register first
      await request(app, 'POST', '/v1/auth/register', {
        body: { email, password, fullName: 'Test User', phone: '11999998888' },
      });

      // Login
      const response = await request(app, 'POST', '/v1/auth/login', {
        body: { email, password, fullName: 'Test User', phone: '11999998888' },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        data: {
          accessToken: string;
          refreshToken: string;
          expiresIn: number;
          user: { id: string; email: string };
        };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
      expect(body.data.expiresIn).toBeGreaterThan(0);
      expect(body.data.user.email).toBe(email);
    });

    it('should reject invalid password', async () => {
      const email = uniqueEmail();

      // Register
      await request(app, 'POST', '/v1/auth/register', {
        body: { email, password: 'SecureP@ss123', fullName: 'Test User', phone: '11999998888' },
      });

      // Login with wrong password
      const response = await request(app, 'POST', '/v1/auth/login', {
        body: { email, password: 'WrongPassword123' },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        error: string;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const response = await request(app, 'POST', '/v1/auth/login', {
        body: { email: 'nonexistent@example.com', password: 'SomePassword123' },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        error: string;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(401);
    });

    it('should return JWT with correct format', async () => {
      const email = uniqueEmail();
      const password = 'SecureP@ss123';

      await request(app, 'POST', '/v1/auth/register', {
        body: { email, password, fullName: 'Test User', phone: '11999998888' },
      });

      const response = await request(app, 'POST', '/v1/auth/login', {
        body: { email, password, fullName: 'Test User', phone: '11999998888' },
      });

      const body = await parseResponse<{
        data: { accessToken: string };
      }>(response);

      // JWT format: header.payload.signature
      const parts = body.data.accessToken.split('.');
      expect(parts).toHaveLength(3);
    });
  });

  // ===========================================================================
  // Token Refresh Tests
  // ===========================================================================
  describe('POST /auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const email = uniqueEmail();
      const password = 'SecureP@ss123';

      // Register and login
      await request(app, 'POST', '/v1/auth/register', {
        body: { email, password, fullName: 'Test User', phone: '11999998888' },
      });

      const loginResponse = await request(app, 'POST', '/v1/auth/login', {
        body: { email, password, fullName: 'Test User', phone: '11999998888' },
      });

      const loginBody = await parseResponse<{
        data: { refreshToken: string };
      }>(loginResponse);

      // Refresh
      const response = await request(app, 'POST', '/v1/auth/refresh', {
        body: { refreshToken: loginBody.data.refreshToken },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        data: {
          accessToken: string;
          refreshToken: string;
          expiresIn: number;
        };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
      // New refresh token should be different (token rotation)
      expect(body.data.refreshToken).not.toBe(loginBody.data.refreshToken);
    });

    it('should reject used refresh token (token rotation)', async () => {
      const email = uniqueEmail();
      const password = 'SecureP@ss123';

      // Register and login
      await request(app, 'POST', '/v1/auth/register', {
        body: { email, password, fullName: 'Test User', phone: '11999998888' },
      });

      const loginResponse = await request(app, 'POST', '/v1/auth/login', {
        body: { email, password, fullName: 'Test User', phone: '11999998888' },
      });

      const loginBody = await parseResponse<{
        data: { refreshToken: string };
      }>(loginResponse);

      const originalRefreshToken = loginBody.data.refreshToken;

      // First refresh - should work
      await request(app, 'POST', '/v1/auth/refresh', {
        body: { refreshToken: originalRefreshToken },
      });

      // Second refresh with same token - should fail (already used)
      const response = await request(app, 'POST', '/v1/auth/refresh', {
        body: { refreshToken: originalRefreshToken },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        error: string;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(401);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app, 'POST', '/v1/auth/refresh', {
        body: { refreshToken: 'invalid-token' },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        error: string;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(401);
    });
  });

  // ===========================================================================
  // Logout Tests
  // ===========================================================================
  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const email = uniqueEmail();
      const password = 'SecureP@ss123';

      // Register and login
      await request(app, 'POST', '/v1/auth/register', {
        body: { email, password, fullName: 'Test User', phone: '11999998888' },
      });

      const loginResponse = await request(app, 'POST', '/v1/auth/login', {
        body: { email, password, fullName: 'Test User', phone: '11999998888' },
      });

      const loginBody = await parseResponse<{
        data: { refreshToken: string };
      }>(loginResponse);

      // Logout
      const response = await request(app, 'POST', '/v1/auth/logout', {
        body: { refreshToken: loginBody.data.refreshToken },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        message: string;
      }>(response);

      expect(body.success).toBe(true);
      expect(body.message).toBe('Logged out successfully');
    });

    it('should invalidate refresh token after logout', async () => {
      const email = uniqueEmail();
      const password = 'SecureP@ss123';

      // Register and login
      await request(app, 'POST', '/v1/auth/register', {
        body: { email, password, fullName: 'Test User', phone: '11999998888' },
      });

      const loginResponse = await request(app, 'POST', '/v1/auth/login', {
        body: { email, password, fullName: 'Test User', phone: '11999998888' },
      });

      const loginBody = await parseResponse<{
        data: { refreshToken: string };
      }>(loginResponse);

      // Logout
      await request(app, 'POST', '/v1/auth/logout', {
        body: { refreshToken: loginBody.data.refreshToken },
      });

      // Try to refresh - should fail
      const response = await request(app, 'POST', '/v1/auth/refresh', {
        body: { refreshToken: loginBody.data.refreshToken },
      });

      const body = await parseResponse<{
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
    });

    it('should handle logout with logoutAll flag', async () => {
      const email = uniqueEmail();
      const password = 'SecureP@ss123';

      // Register and login twice (simulating two devices)
      await request(app, 'POST', '/v1/auth/register', {
        body: { email, password, fullName: 'Test User', phone: '11999998888' },
      });

      const login1 = await request(app, 'POST', '/v1/auth/login', {
        body: { email, password, fullName: 'Test User', phone: '11999998888' },
      });

      const login2 = await request(app, 'POST', '/v1/auth/login', {
        body: { email, password, fullName: 'Test User', phone: '11999998888' },
      });

      const body1 = await parseResponse<{ data: { refreshToken: string } }>(login1);
      const body2 = await parseResponse<{ data: { refreshToken: string } }>(login2);

      // Logout all using first token
      await request(app, 'POST', '/v1/auth/logout', {
        body: { refreshToken: body1.data.refreshToken, logoutAll: true },
      });

      // Try to use second token - should also be invalidated
      const response = await request(app, 'POST', '/v1/auth/refresh', {
        body: { refreshToken: body2.data.refreshToken },
      });

      const refreshBody = await parseResponse<{ success: boolean }>(response);
      expect(refreshBody.success).toBe(false);
    });
  });

  // ===========================================================================
  // Protected Endpoint Tests
  // ===========================================================================
  describe('GET /auth/me', () => {
    it('should return user data with valid token', async () => {
      const email = uniqueEmail();
      const password = 'SecureP@ss123';

      // Register and login
      await request(app, 'POST', '/v1/auth/register', {
        body: { email, password, fullName: 'Test User', phone: '11999998888' },
      });

      const loginResponse = await request(app, 'POST', '/v1/auth/login', {
        body: { email, password, fullName: 'Test User', phone: '11999998888' },
      });

      const loginBody = await parseResponse<{
        data: { accessToken: string; user: { id: string } };
      }>(loginResponse);

      // Get current user
      const response = await request(app, 'GET', '/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${loginBody.data.accessToken}`,
        },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        data: {
          id: string;
          email: string;
          createdAt: string;
        };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.email).toBe(email);
      expect(body.data.id).toBe(loginBody.data.user.id);
      expect(body.data.createdAt).toBeDefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app, 'GET', '/v1/auth/me');

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        error: string;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app, 'GET', '/v1/auth/me', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        error: string;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(401);
    });

    it('should reject request with malformed Authorization header', async () => {
      const response = await request(app, 'GET', '/v1/auth/me', {
        headers: {
          Authorization: 'NotBearer token',
        },
      });

      const body = await parseResponse<{
        success: boolean;
      }>(response);

      expect(body.success).toBe(false);
    });
  });

  // ===========================================================================
  // Get User by ID Tests
  // ===========================================================================
  describe('GET /auth/:userId', () => {
    it('should return user by ID', async () => {
      const email = uniqueEmail();
      const password = 'SecureP@ss123';

      // Register and login
      await request(app, 'POST', '/v1/auth/register', {
        body: { email, password, fullName: 'Test User', phone: '11999998888' },
      });

      const loginResponse = await request(app, 'POST', '/v1/auth/login', {
        body: { email, password },
      });

      const loginBody = await parseResponse<{
        data: { user: { id: string } };
      }>(loginResponse);

      // Get user by ID
      const response = await request(app, 'GET', `/v1/auth/${loginBody.data.user.id}`);

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        data: {
          id: string;
          email: string;
          createdAt: string;
        };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.id).toBe(loginBody.data.user.id);
      expect(body.data.email).toBe(email);
    });

    it('should return error for non-existent user', async () => {
      // Use a valid UUID v7 format for the non-existent user
      const response = await request(app, 'GET', '/v1/auth/019b16e0-3678-7519-82de-a0516bdd7c2d');

      // Should return error status (404 for not found, or 422 for validation)
      expect(response.status >= 400).toBe(true);
    });
  });

  // ===========================================================================
  // Full Authentication Flow Tests
  // ===========================================================================
  describe('Full Authentication Flow', () => {
    it('should complete full auth cycle: register → login → refresh → logout', async () => {
      const email = uniqueEmail();
      const password = 'SecureP@ss123';

      // 1. Register
      const registerResponse = await request(app, 'POST', '/v1/auth/register', {
        body: { email, password, fullName: 'Test User', phone: '11999998888' },
      });
      const registerBody = await parseResponse<{ success: boolean }>(registerResponse);
      expect(registerBody.success).toBe(true);

      // 2. Login
      const loginResponse = await request(app, 'POST', '/v1/auth/login', {
        body: { email, password, fullName: 'Test User', phone: '11999998888' },
      });
      const loginBody = await parseResponse<{
        success: boolean;
        data: { accessToken: string; refreshToken: string };
      }>(loginResponse);
      expect(loginBody.success).toBe(true);

      // 3. Access protected endpoint
      const meResponse = await request(app, 'GET', '/v1/auth/me', {
        headers: { Authorization: `Bearer ${loginBody.data.accessToken}` },
      });
      const meBody = await parseResponse<{ success: boolean }>(meResponse);
      expect(meBody.success).toBe(true);

      // 4. Refresh tokens
      const refreshResponse = await request(app, 'POST', '/v1/auth/refresh', {
        body: { refreshToken: loginBody.data.refreshToken },
      });
      const refreshBody = await parseResponse<{
        success: boolean;
        data: { accessToken: string; refreshToken: string };
      }>(refreshResponse);
      expect(refreshBody.success).toBe(true);

      // 5. Access with new token
      const me2Response = await request(app, 'GET', '/v1/auth/me', {
        headers: { Authorization: `Bearer ${refreshBody.data.accessToken}` },
      });
      const me2Body = await parseResponse<{ success: boolean }>(me2Response);
      expect(me2Body.success).toBe(true);

      // 6. Logout
      const logoutResponse = await request(app, 'POST', '/v1/auth/logout', {
        body: { refreshToken: refreshBody.data.refreshToken },
      });
      const logoutBody = await parseResponse<{ success: boolean }>(logoutResponse);
      expect(logoutBody.success).toBe(true);

      // 7. Refresh should now fail
      const failedRefresh = await request(app, 'POST', '/v1/auth/refresh', {
        body: { refreshToken: refreshBody.data.refreshToken },
      });
      const failedBody = await parseResponse<{ success: boolean }>(failedRefresh);
      expect(failedBody.success).toBe(false);
    });
  });
});
