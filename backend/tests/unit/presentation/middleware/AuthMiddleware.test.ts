import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import {
  createAuthMiddleware,
  createOptionalAuthMiddleware,
  extractClientInfo,
  type AuthenticatedUser,
} from '@auth/presentation/middleware/AuthMiddleware.ts';
import type { ITokenService, TokenPayload } from '@auth/domain/services/ITokenService.ts';
import type { UserId } from '@auth/domain/value-objects/UserId.ts';
import { preloadAllLocales } from '@shared/infrastructure/i18n/index.js';

/**
 * Mock Token Service for testing
 */
class MockTokenService implements ITokenService {
  public validTokens: Map<string, TokenPayload> = new Map();

  generateAccessToken(userId: UserId, email: string, roles: string[]): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
      userId: userId.toValue(),
      email,
      roles,
      iat: now,
      exp: now + 900,
    };
    const token = `access-${payload.userId}`;
    this.validTokens.set(token, payload);
    return token;
  }

  verifyAccessToken(token: string): TokenPayload | null {
    return this.validTokens.get(token) ?? null;
  }

  getAccessTokenExpiryMs(): number {
    return 900000; // 15 minutes
  }

  getRefreshTokenExpiryMs(): number {
    return 604800000; // 7 days
  }

  addValidToken(token: string, payload: TokenPayload): void {
    this.validTokens.set(token, payload);
  }

  clear(): void {
    this.validTokens.clear();
  }
}

/**
 * Create mock Elysia context
 */
function createMockContext(headers: Record<string, string> = {}): any {
  // Always include accept-language for i18n to work
  const finalHeaders = {
    'accept-language': 'en-US',
    ...headers,
  };
  return {
    request: {
      headers: {
        get: (name: string) => finalHeaders[name.toLowerCase() as keyof typeof finalHeaders] ?? null,
      },
    },
  };
}

describe('AuthMiddleware', () => {
  let tokenService: MockTokenService;

  // Preload i18n locales before running tests
  beforeAll(async () => {
    await preloadAllLocales();
  }, 30000); // 30 second timeout for i18n loading

  beforeEach(() => {
    tokenService = new MockTokenService();
  });

  describe('createAuthMiddleware', () => {
    it('should return error response when no authorization header', async () => {
      const middleware = createAuthMiddleware(tokenService);
      const ctx = createMockContext({});

      const result = await middleware(ctx);

      expect(result).toBeInstanceOf(Response);
      const response = result as Response;
      expect(response.status).toBe(401);

      const body = await response.json() as { success: boolean; error: string };
      expect(body.success).toBe(false);
      expect(body.error).toBe('Authorization header required');
    });

    it('should return error response for invalid authorization format', async () => {
      const middleware = createAuthMiddleware(tokenService);
      const ctx = createMockContext({
        authorization: 'Basic abc123',
      });

      const result = await middleware(ctx);

      expect(result).toBeInstanceOf(Response);
      const response = result as Response;
      expect(response.status).toBe(401);

      const body = await response.json() as { error: string };
      expect(body.error).toContain('Invalid authorization format');
    });

    it('should return error response for invalid token', async () => {
      const middleware = createAuthMiddleware(tokenService);
      const ctx = createMockContext({
        authorization: 'Bearer invalid-token',
      });

      const result = await middleware(ctx);

      expect(result).toBeInstanceOf(Response);
      const response = result as Response;
      expect(response.status).toBe(401);

      const body = await response.json() as { error: string };
      expect(body.error).toBe('Token expired or invalid');
    });

    it('should return user for valid token with roles', async () => {
      const middleware = createAuthMiddleware(tokenService);
      const now = Math.floor(Date.now() / 1000);
      tokenService.addValidToken('valid-token', {
        userId: 'user-123',
        email: 'test@example.com',
        roles: ['admin', 'user'],
        iat: now,
        exp: now + 900,
      });

      const ctx = createMockContext({
        authorization: 'Bearer valid-token',
      });

      const result = await middleware(ctx);

      expect(result).not.toBeInstanceOf(Response);
      const authResult = result as { user: AuthenticatedUser };
      expect(authResult.user.userId).toBe('user-123');
      expect(authResult.user.email).toBe('test@example.com');
      expect(authResult.user.roles).toEqual(['admin', 'user']);
    });

    it('should return empty roles array when token has no roles', async () => {
      const middleware = createAuthMiddleware(tokenService);
      const now = Math.floor(Date.now() / 1000);
      tokenService.addValidToken('valid-token', {
        userId: 'user-123',
        email: 'test@example.com',
        roles: undefined as any,
        iat: now,
        exp: now + 900,
      });

      const ctx = createMockContext({
        authorization: 'Bearer valid-token',
      });

      const result = await middleware(ctx);

      expect(result).not.toBeInstanceOf(Response);
      const authResult = result as { user: AuthenticatedUser };
      expect(authResult.user.roles).toEqual([]);
    });

    it('should extract token correctly from Bearer header', async () => {
      const middleware = createAuthMiddleware(tokenService);
      const now = Math.floor(Date.now() / 1000);
      const payload: TokenPayload = {
        userId: 'extracted-user',
        email: 'extracted@example.com',
        roles: ['user'],
        iat: now,
        exp: now + 900,
      };
      tokenService.addValidToken('extracted-token', payload);

      const ctx = createMockContext({
        authorization: 'Bearer extracted-token',
      });

      const result = await middleware(ctx);

      expect(result).not.toBeInstanceOf(Response);
      const authResult = result as { user: AuthenticatedUser };
      expect(authResult.user.userId).toBe('extracted-user');
    });
  });

  describe('createOptionalAuthMiddleware', () => {
    it('should return null user when no authorization header', async () => {
      const middleware = createOptionalAuthMiddleware(tokenService);
      const ctx = createMockContext({});

      const result = await middleware(ctx);

      expect(result.user).toBeNull();
    });

    it('should return null user for invalid format', async () => {
      const middleware = createOptionalAuthMiddleware(tokenService);
      const ctx = createMockContext({
        authorization: 'Basic token',
      });

      const result = await middleware(ctx);

      expect(result.user).toBeNull();
    });

    it('should return null user for invalid token', async () => {
      const middleware = createOptionalAuthMiddleware(tokenService);
      const ctx = createMockContext({
        authorization: 'Bearer invalid',
      });

      const result = await middleware(ctx);

      expect(result.user).toBeNull();
    });

    it('should return user for valid token', async () => {
      const middleware = createOptionalAuthMiddleware(tokenService);
      const now = Math.floor(Date.now() / 1000);
      tokenService.addValidToken('valid-token', {
        userId: 'user-123',
        email: 'test@example.com',
        roles: ['user'],
        iat: now,
        exp: now + 900,
      });

      const ctx = createMockContext({
        authorization: 'Bearer valid-token',
      });

      const result = await middleware(ctx);

      expect(result.user).not.toBeNull();
      expect(result.user!.userId).toBe('user-123');
      expect(result.user!.email).toBe('test@example.com');
    });

    it('should handle token without roles', async () => {
      const middleware = createOptionalAuthMiddleware(tokenService);
      const now = Math.floor(Date.now() / 1000);
      tokenService.addValidToken('valid-token', {
        userId: 'user-123',
        email: 'test@example.com',
        roles: undefined as any,
        iat: now,
        exp: now + 900,
      });

      const ctx = createMockContext({
        authorization: 'Bearer valid-token',
      });

      const result = await middleware(ctx);

      expect(result.user!.roles).toEqual([]);
    });
  });

  describe('extractClientInfo', () => {
    it('should extract user agent', () => {
      const ctx = createMockContext({
        'user-agent': 'Mozilla/5.0',
      });

      const info = extractClientInfo(ctx);

      expect(info.userAgent).toBe('Mozilla/5.0');
    });

    it('should return undefined user agent when not present', () => {
      const ctx = createMockContext({});

      const info = extractClientInfo(ctx);

      expect(info.userAgent).toBeUndefined();
    });

    it('should extract IP from x-forwarded-for header', () => {
      const ctx = createMockContext({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      });

      const info = extractClientInfo(ctx);

      expect(info.ipAddress).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header when x-forwarded-for not present', () => {
      const ctx = createMockContext({
        'x-real-ip': '192.168.1.100',
      });

      const info = extractClientInfo(ctx);

      expect(info.ipAddress).toBe('192.168.1.100');
    });

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const ctx = createMockContext({
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '192.168.1.100',
      });

      const info = extractClientInfo(ctx);

      expect(info.ipAddress).toBe('192.168.1.1');
    });

    it('should return undefined IP when no headers present', () => {
      const ctx = createMockContext({});

      const info = extractClientInfo(ctx);

      expect(info.ipAddress).toBeUndefined();
    });

    it('should trim IP from x-forwarded-for', () => {
      const ctx = createMockContext({
        'x-forwarded-for': '  192.168.1.1  ',
      });

      const info = extractClientInfo(ctx);

      expect(info.ipAddress).toBe('192.168.1.1');
    });
  });
});
