import { describe, it, expect, beforeAll } from 'vitest';
import {
  createRoleMiddleware,
  requireAdmin,
  requireUser,
  requireAnyRole,
  requireAllRoles,
} from '@auth/presentation/middleware/AuthorizationMiddleware.ts';
import type { AuthenticatedUser } from '@auth/presentation/middleware/AuthMiddleware.ts';
import { preloadAllLocales } from '@shared/infrastructure/i18n/index.js';

/**
 * Create mock context with optional user
 */
function createMockContext(user?: AuthenticatedUser): any {
  return {
    user,
    request: {
      headers: {
        get: (name: string) => name.toLowerCase() === 'accept-language' ? 'en-US' : null,
      },
    },
  };
}

/**
 * Parse response body helper
 */
async function parseResponse(response: Response): Promise<any> {
  return response.json();
}

describe('AuthorizationMiddleware', () => {
  // Preload i18n locales before running tests
  beforeAll(async () => {
    await preloadAllLocales();
  }, 30000); // 30 second timeout for i18n loading

  describe('createRoleMiddleware', () => {
    describe('authentication check', () => {
      it('should return 401 when user is not authenticated', async () => {
        const middleware = createRoleMiddleware('admin');
        const ctx = createMockContext(undefined);

        const result = await middleware(ctx);

        expect(result).toBeInstanceOf(Response);
        const response = result as Response;
        expect(response.status).toBe(401);

        const body = await parseResponse(response);
        expect(body.error).toBe('Authentication required');
      });

      it('should return 401 when user object is missing', async () => {
        const middleware = createRoleMiddleware(['admin', 'user']);
        // Use createMockContext with undefined user to ensure request.headers exists
        const ctx = createMockContext(undefined);

        const result = await middleware(ctx);

        expect(result).toBeInstanceOf(Response);
        expect((result as Response).status).toBe(401);
      });
    });

    describe('single role requirement', () => {
      it('should allow access when user has required role', async () => {
        const middleware = createRoleMiddleware('admin');
        const ctx = createMockContext({
          userId: 'user-123',
          email: 'admin@example.com',
          roles: ['admin', 'user'],
        });

        const result = await middleware(ctx);

        expect(result).toBeUndefined();
      });

      it('should deny access when user lacks required role', async () => {
        const middleware = createRoleMiddleware('admin');
        const ctx = createMockContext({
          userId: 'user-123',
          email: 'user@example.com',
          roles: ['user'],
        });

        const result = await middleware(ctx);

        expect(result).toBeInstanceOf(Response);
        const response = result as Response;
        expect(response.status).toBe(403);

        const body = await parseResponse(response);
        expect(body.error).toBe('Insufficient permissions');
      });

      it('should handle user with empty roles array', async () => {
        const middleware = createRoleMiddleware('admin');
        const ctx = createMockContext({
          userId: 'user-123',
          email: 'user@example.com',
          roles: [],
        });

        const result = await middleware(ctx);

        expect(result).toBeInstanceOf(Response);
        expect((result as Response).status).toBe(403);
      });

      it('should handle user with undefined roles', async () => {
        const middleware = createRoleMiddleware('admin');
        const ctx = createMockContext({
          userId: 'user-123',
          email: 'user@example.com',
          roles: undefined as any,
        });

        const result = await middleware(ctx);

        expect(result).toBeInstanceOf(Response);
        expect((result as Response).status).toBe(403);
      });
    });

    describe('multiple roles - requireAll: false (default)', () => {
      it('should allow access when user has any of required roles', async () => {
        const middleware = createRoleMiddleware(['admin', 'moderator']);
        const ctx = createMockContext({
          userId: 'user-123',
          email: 'mod@example.com',
          roles: ['moderator'],
        });

        const result = await middleware(ctx);

        expect(result).toBeUndefined();
      });

      it('should allow access when user has all required roles', async () => {
        const middleware = createRoleMiddleware(['admin', 'moderator']);
        const ctx = createMockContext({
          userId: 'user-123',
          email: 'admin@example.com',
          roles: ['admin', 'moderator', 'user'],
        });

        const result = await middleware(ctx);

        expect(result).toBeUndefined();
      });

      it('should deny access when user has none of required roles', async () => {
        const middleware = createRoleMiddleware(['admin', 'moderator']);
        const ctx = createMockContext({
          userId: 'user-123',
          email: 'user@example.com',
          roles: ['user'],
        });

        const result = await middleware(ctx);

        expect(result).toBeInstanceOf(Response);
        expect((result as Response).status).toBe(403);
      });
    });

    describe('multiple roles - requireAll: true', () => {
      it('should allow access when user has all required roles', async () => {
        const middleware = createRoleMiddleware(['admin', 'moderator'], true);
        const ctx = createMockContext({
          userId: 'user-123',
          email: 'admin@example.com',
          roles: ['admin', 'moderator'],
        });

        const result = await middleware(ctx);

        expect(result).toBeUndefined();
      });

      it('should deny access when user has some but not all required roles', async () => {
        const middleware = createRoleMiddleware(['admin', 'moderator'], true);
        const ctx = createMockContext({
          userId: 'user-123',
          email: 'admin@example.com',
          roles: ['admin'],
        });

        const result = await middleware(ctx);

        expect(result).toBeInstanceOf(Response);
        expect((result as Response).status).toBe(403);
      });

      it('should deny access when user has none of required roles', async () => {
        const middleware = createRoleMiddleware(['admin', 'moderator'], true);
        const ctx = createMockContext({
          userId: 'user-123',
          email: 'user@example.com',
          roles: ['user'],
        });

        const result = await middleware(ctx);

        expect(result).toBeInstanceOf(Response);
        expect((result as Response).status).toBe(403);
      });
    });
  });

  describe('requireAdmin', () => {
    it('should create middleware requiring admin role', async () => {
      const middleware = requireAdmin();
      const ctx = createMockContext({
        userId: 'user-123',
        email: 'admin@example.com',
        roles: ['admin'],
      });

      const result = await middleware(ctx);

      expect(result).toBeUndefined();
    });

    it('should deny non-admin users', async () => {
      const middleware = requireAdmin();
      const ctx = createMockContext({
        userId: 'user-123',
        email: 'user@example.com',
        roles: ['user'],
      });

      const result = await middleware(ctx);

      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(403);
    });
  });

  describe('requireUser', () => {
    it('should create middleware requiring user role', async () => {
      const middleware = requireUser();
      const ctx = createMockContext({
        userId: 'user-123',
        email: 'user@example.com',
        roles: ['user'],
      });

      const result = await middleware(ctx);

      expect(result).toBeUndefined();
    });

    it('should deny users without user role', async () => {
      const middleware = requireUser();
      const ctx = createMockContext({
        userId: 'user-123',
        email: 'guest@example.com',
        roles: ['guest'],
      });

      const result = await middleware(ctx);

      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(403);
    });
  });

  describe('requireAnyRole', () => {
    it('should create middleware requiring any of specified roles', async () => {
      const middleware = requireAnyRole(['editor', 'moderator']);
      const ctx = createMockContext({
        userId: 'user-123',
        email: 'editor@example.com',
        roles: ['editor'],
      });

      const result = await middleware(ctx);

      expect(result).toBeUndefined();
    });

    it('should allow access with any matching role', async () => {
      const middleware = requireAnyRole(['editor', 'moderator']);
      const ctx = createMockContext({
        userId: 'user-123',
        email: 'mod@example.com',
        roles: ['moderator'],
      });

      const result = await middleware(ctx);

      expect(result).toBeUndefined();
    });

    it('should deny access when no roles match', async () => {
      const middleware = requireAnyRole(['editor', 'moderator']);
      const ctx = createMockContext({
        userId: 'user-123',
        email: 'user@example.com',
        roles: ['user'],
      });

      const result = await middleware(ctx);

      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(403);
    });
  });

  describe('requireAllRoles', () => {
    it('should create middleware requiring all specified roles', async () => {
      const middleware = requireAllRoles(['editor', 'moderator']);
      const ctx = createMockContext({
        userId: 'user-123',
        email: 'senior@example.com',
        roles: ['editor', 'moderator', 'user'],
      });

      const result = await middleware(ctx);

      expect(result).toBeUndefined();
    });

    it('should deny access when missing one role', async () => {
      const middleware = requireAllRoles(['editor', 'moderator']);
      const ctx = createMockContext({
        userId: 'user-123',
        email: 'editor@example.com',
        roles: ['editor'],
      });

      const result = await middleware(ctx);

      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(403);
    });
  });

  describe('response format', () => {
    it('should return JSON response with correct structure for 401', async () => {
      const middleware = createRoleMiddleware('admin');
      const ctx = createMockContext(undefined);

      const result = await middleware(ctx);
      const response = result as Response;
      const body = await parseResponse(response);

      expect(response.headers.get('content-type')).toBe('application/json');
      expect(body.statusCode).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Authentication required');
    });

    it('should return JSON response with correct structure for 403', async () => {
      const middleware = createRoleMiddleware('admin');
      const ctx = createMockContext({
        userId: 'user-123',
        email: 'user@example.com',
        roles: ['user'],
      });

      const result = await middleware(ctx);
      const response = result as Response;
      const body = await parseResponse(response);

      expect(response.headers.get('content-type')).toBe('application/json');
      expect(body.statusCode).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Insufficient permissions');
    });
  });
});
