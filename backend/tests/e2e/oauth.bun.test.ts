import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Elysia } from 'elysia';
import { SQL } from 'bun';
import { drizzle } from 'drizzle-orm/bun-sql';
import { v7 as uuidv7 } from 'uuid';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import type { IOAuthService, OAuthResult, OAuthTokens } from '@auth/domain/services/IOAuthService.ts';
import { AuthProvider } from '@auth/domain/value-objects/AuthProvider.ts';
import { OAuthProfile } from '@auth/domain/value-objects/OAuthProfile.ts';
import { Result } from '@shared/domain/Result.ts';
import {
  usersTable,
  refreshTokensTable,
  rolesTable,
  permissionsTable,
  userRolesTable,
  rolePermissionsTable,
  userPermissionsTable,
  oauthConnectionsTable,
} from '../../src/contexts/auth/infrastructure/persistence/drizzle/schema.ts';

// Infrastructure imports
import { DrizzleUserRepository } from '../../src/contexts/auth/infrastructure/persistence/drizzle/DrizzleUserRepository.ts';
import { DrizzleRefreshTokenRepository } from '../../src/contexts/auth/infrastructure/persistence/drizzle/DrizzleRefreshTokenRepository.ts';
import { DrizzleRoleRepository } from '../../src/contexts/auth/infrastructure/persistence/drizzle/DrizzleRoleRepository.ts';
import { DrizzleOAuthConnectionRepository } from '../../src/contexts/auth/infrastructure/persistence/drizzle/DrizzleOAuthConnectionRepository.ts';
import { JwtTokenService } from '../../src/contexts/auth/infrastructure/services/JwtTokenService.ts';

// Handlers
import { OAuthLoginHandler } from '../../src/contexts/auth/application/commands/oauth-login/OAuthLoginHandler.ts';
import { LinkOAuthAccountHandler } from '../../src/contexts/auth/application/commands/link-oauth-account/LinkOAuthAccountHandler.ts';
import { UnlinkOAuthAccountHandler } from '../../src/contexts/auth/application/commands/unlink-oauth-account/UnlinkOAuthAccountHandler.ts';
import { GetOAuthAuthorizationUrlHandler } from '../../src/contexts/auth/application/queries/get-oauth-authorization-url/GetOAuthAuthorizationUrlHandler.ts';
import { GetUserOAuthConnectionsHandler } from '../../src/contexts/auth/application/queries/get-user-oauth-connections/GetUserOAuthConnectionsHandler.ts';

// Controllers
import { OAuthController } from '../../src/contexts/auth/presentation/http/OAuthController.ts';
import { OAuthAccountController } from '../../src/contexts/auth/presentation/http/OAuthAccountController.ts';

// i18n imports
import {
  i18nPlugin,
  preloadAllLocales,
} from '@shared/infrastructure/i18n/index.js';

/**
 * E2E Tests for OAuth Endpoints
 * Uses mocked OAuth service since we can't call real providers in tests
 */

// Test database URL
const TEST_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://app:app@localhost:5435/app_test';

// Store test instances
let testSqlClient: SQL | null = null;
let testDrizzleDb: DrizzleDatabase | null = null;

/**
 * Test Database Provider
 */
class TestDatabaseProvider implements IDatabaseProvider {
  constructor(private database: DrizzleDatabase) {}
  getDb(): DrizzleDatabase {
    return this.database;
  }
}

/**
 * Mock OAuth Service for E2E tests
 * Simulates OAuth provider responses without real network calls
 */
class MockOAuthService implements IOAuthService {
  private enabledProviders = new Set<string>(['google', 'facebook', 'apple']);
  private mockProfiles: Map<string, OAuthProfile> = new Map();
  private shouldFail = false;
  private failMessage = '';

  // Configure mock to return specific profile for a provider
  setMockProfile(provider: string, profile: OAuthProfile): void {
    this.mockProfiles.set(provider, profile);
  }

  // Configure mock to fail
  setFailure(fail: boolean, message: string = 'OAuth error'): void {
    this.shouldFail = fail;
    this.failMessage = message;
  }

  // Clear all mock configurations
  reset(): void {
    this.mockProfiles.clear();
    this.shouldFail = false;
    this.failMessage = '';
  }

  isProviderEnabled(provider: AuthProvider): boolean {
    return this.enabledProviders.has(provider.getValue());
  }

  getEnabledProviders(): AuthProvider[] {
    return Array.from(this.enabledProviders).map((p) => AuthProvider.create(p).getValue());
  }

  async getAuthorizationUrl(
    provider: AuthProvider,
    state: string,
    codeVerifier?: string
  ): Promise<Result<string>> {
    if (!this.isProviderEnabled(provider)) {
      return Result.fail(`Provider ${provider.getValue()} is not enabled`);
    }

    const baseUrl = `https://accounts.${provider.getValue()}.com/oauth/authorize`;
    const url = `${baseUrl}?state=${state}&client_id=test-client-id`;
    return Result.ok(url);
  }

  async exchangeCodeForTokens(
    provider: AuthProvider,
    code: string,
    codeVerifier?: string
  ): Promise<Result<OAuthResult>> {
    if (this.shouldFail) {
      return Result.fail(this.failMessage);
    }

    // Get mock profile or create default
    let profile = this.mockProfiles.get(provider.getValue());
    if (!profile) {
      profile = OAuthProfile.create({
        provider,
        providerUserId: `${provider.getValue()}-user-${code}`,
        email: `mock-${code}@${provider.getValue()}.com`,
        name: `Mock ${provider.getValue()} User`,
        avatarUrl: `https://example.com/avatar.jpg`,
      }).getValue();
    }

    const tokens: OAuthTokens = {
      accessToken: `mock-access-token-${code}`,
      refreshToken: `mock-refresh-token-${code}`,
      expiresAt: new Date(Date.now() + 3600000),
      idToken: null,
    };

    return Result.ok({ profile, tokens });
  }

  async refreshAccessToken(provider: AuthProvider, refreshToken: string): Promise<Result<OAuthTokens>> {
    return Result.ok({
      accessToken: 'new-mock-access-token',
      refreshToken: 'new-mock-refresh-token',
      expiresAt: new Date(Date.now() + 3600000),
    });
  }

  async revokeToken(provider: AuthProvider, accessToken: string): Promise<Result<void>> {
    return Result.ok<void>(undefined);
  }
}

// Global mock OAuth service
const mockOAuthService = new MockOAuthService();

/**
 * Create test database connection
 */
async function createTestDatabase(): Promise<{ db: DrizzleDatabase; sql: SQL }> {
  const sql = new SQL(TEST_DATABASE_URL);
  const drizzleDb = drizzle(sql);
  await sql.unsafe('SELECT 1');
  return { db: drizzleDb, sql };
}

/**
 * Clear all data from test database
 */
async function clearTestDatabase(): Promise<void> {
  if (testDrizzleDb) {
    // Clear OAuth connections first
    await testDrizzleDb.delete(oauthConnectionsTable);
    // Clear junction tables
    await testDrizzleDb.delete(userPermissionsTable);
    await testDrizzleDb.delete(rolePermissionsTable);
    await testDrizzleDb.delete(userRolesTable);
    await testDrizzleDb.delete(refreshTokensTable);
    // Clear main tables
    await testDrizzleDb.delete(permissionsTable);
    await testDrizzleDb.delete(rolesTable);
    await testDrizzleDb.delete(usersTable);
  }
}

/**
 * Create test application with OAuth routes
 */
async function createTestApp() {
  // Preload all i18n locales before creating app
  // Required for getTranslatorSync in error handlers
  await preloadAllLocales();

  // Create database connection
  const { db, sql } = await createTestDatabase();
  testSqlClient = sql;
  testDrizzleDb = db;

  await clearTestDatabase();

  const testProvider = new TestDatabaseProvider(db);

  // Create repositories
  const roleRepository = new DrizzleRoleRepository(testProvider);
  const userRepository = new DrizzleUserRepository(testProvider, roleRepository);
  const refreshTokenRepository = new DrizzleRefreshTokenRepository(testProvider);
  const oauthConnectionRepository = new DrizzleOAuthConnectionRepository(testProvider);

  // Create services
  const tokenService = new JwtTokenService();

  // Create handlers
  const oauthLoginHandler = new OAuthLoginHandler(
    userRepository,
    oauthConnectionRepository,
    refreshTokenRepository,
    mockOAuthService,
    tokenService
  );

  const linkOAuthAccountHandler = new LinkOAuthAccountHandler(
    userRepository,
    oauthConnectionRepository,
    mockOAuthService
  );

  const unlinkOAuthAccountHandler = new UnlinkOAuthAccountHandler(
    userRepository,
    oauthConnectionRepository,
    mockOAuthService
  );

  const getOAuthAuthorizationUrlHandler = new GetOAuthAuthorizationUrlHandler(mockOAuthService);

  const getUserOAuthConnectionsHandler = new GetUserOAuthConnectionsHandler(userRepository, oauthConnectionRepository);

  // Create controller
  const oauthController = new OAuthController(
    oauthLoginHandler,
    getOAuthAuthorizationUrlHandler,
    tokenService,
    mockOAuthService
  );

  const oauthAccountController = new OAuthAccountController(
    linkOAuthAccountHandler,
    unlinkOAuthAccountHandler,
    getUserOAuthConnectionsHandler,
    tokenService
  );

  // Create app and register routes with i18n support
  let app = new Elysia()
    .use(i18nPlugin);
  app = oauthController.routes(app);
  app = oauthAccountController.routes(app);

  return app;
}

/**
 * Helper to make HTTP requests
 */
async function request(
  app: { handle: (request: Request) => Promise<Response> | Response },
  method: string,
  path: string,
  options?: {
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
  }
): Promise<Response> {
  const url = `http://localhost${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  const requestInit: RequestInit = {
    method,
    headers,
  };

  if (options?.body) {
    requestInit.body = JSON.stringify(options.body);
  }

  return app.handle(new Request(url, requestInit));
}

/**
 * Helper to parse JSON response
 */
async function parseResponse<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

// ============================================================================
// Tests
// ============================================================================

describe('OAuth Endpoints E2E Tests', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    if (testSqlClient) {
      try {
        await testSqlClient.close();
      } catch {
        // Ignore
      }
      testSqlClient = null;
      testDrizzleDb = null;
    }
  });

  beforeEach(async () => {
    await clearTestDatabase();
    mockOAuthService.reset();
  });

  // ==========================================================================
  // GET /v1/auth/oauth/providers
  // ==========================================================================
  describe('GET /v1/auth/oauth/providers', () => {
    it('should return list of enabled providers', async () => {
      const response = await request(app, 'GET', '/v1/auth/oauth/providers');

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        data: { providers: string[] };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.providers).toContain('google');
      expect(body.data.providers).toContain('facebook');
      expect(body.data.providers).toContain('apple');
    });
  });

  // ==========================================================================
  // GET /v1/auth/oauth/:provider/authorize
  // ==========================================================================
  describe('GET /v1/auth/oauth/:provider/authorize', () => {
    it('should return authorization URL for Google', async () => {
      const response = await request(app, 'GET', '/v1/auth/oauth/google/authorize');

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        data: {
          authorizationUrl: string;
          state: string;
          codeVerifier?: string;
        };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.authorizationUrl).toContain('google.com');
      expect(body.data.state).toBeDefined();
    });

    it('should return authorization URL for Facebook', async () => {
      const response = await request(app, 'GET', '/v1/auth/oauth/facebook/authorize');

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        data: { authorizationUrl: string; state: string };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.authorizationUrl).toContain('facebook.com');
    });

    it('should return authorization URL for Apple', async () => {
      const response = await request(app, 'GET', '/v1/auth/oauth/apple/authorize');

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        data: { authorizationUrl: string; state: string };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.authorizationUrl).toContain('apple.com');
    });
  });

  // ==========================================================================
  // POST /v1/auth/oauth/:provider/callback
  // ==========================================================================
  describe('POST /v1/auth/oauth/:provider/callback', () => {
    it('should create new user on first-time OAuth login', async () => {
      const response = await request(app, 'POST', '/v1/auth/oauth/google/callback', {
        body: { code: 'test-auth-code' },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        data: {
          accessToken: string;
          refreshToken: string;
          expiresIn: number;
          user: { id: string; email: string; roles: string[] };
        };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeDefined();
      expect(body.data.refreshToken).toBeDefined();
      expect(body.data.user.email).toContain('@google.com');
    });

    it('should login existing user with OAuth connection', async () => {
      // First login creates user
      await request(app, 'POST', '/v1/auth/oauth/google/callback', {
        body: { code: 'returning-user' },
      });

      // Second login should find existing connection
      const response = await request(app, 'POST', '/v1/auth/oauth/google/callback', {
        body: { code: 'returning-user' },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        data: { accessToken: string; user: { id: string } };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeDefined();
    });

    it('should fail with invalid code', async () => {
      mockOAuthService.setFailure(true, 'Invalid authorization code');

      const response = await request(app, 'POST', '/v1/auth/oauth/google/callback', {
        body: { code: 'invalid-code' },
      });

      expect(response.status).toBe(401);

      const body = await parseResponse<{
        statusCode: number;
        success: boolean;
        error: string;
      }>(response);

      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid authorization code');
    });

    it('should work with Facebook provider', async () => {
      const response = await request(app, 'POST', '/v1/auth/oauth/facebook/callback', {
        body: { code: 'fb-auth-code' },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        success: boolean;
        data: { user: { email: string } };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.user.email).toContain('@facebook.com');
    });

    it('should work with Apple provider', async () => {
      const response = await request(app, 'POST', '/v1/auth/oauth/apple/callback', {
        body: { code: 'apple-auth-code' },
      });

      expect(response.status).toBe(200);

      const body = await parseResponse<{
        success: boolean;
        data: { user: { email: string } };
      }>(response);

      expect(body.success).toBe(true);
      expect(body.data.user.email).toContain('@apple.com');
    });
  });

  // ==========================================================================
  // Protected endpoints (link/unlink/connections)
  // ==========================================================================
  describe('Protected OAuth endpoints', () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
      // Create a user via OAuth login first
      const response = await request(app, 'POST', '/v1/auth/oauth/google/callback', {
        body: { code: 'test-user-code' },
      });

      const body = await parseResponse<{
        data: { accessToken: string; user: { id: string } };
      }>(response);

      accessToken = body.data.accessToken;
      userId = body.data.user.id;
    });

    describe('GET /v1/auth/oauth/connections', () => {
      it('should return user OAuth connections', async () => {
        const response = await request(app, 'GET', '/v1/auth/oauth/connections', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        expect(response.status).toBe(200);

        const body = await parseResponse<{
          statusCode: number;
          success: boolean;
          data: {
            connections: Array<{
              provider: string;
              email: string | null;
              name: string | null;
              linkedAt: string;
            }>;
            totalConnections: number;
          };
        }>(response);

        expect(body.success).toBe(true);
        expect(body.data.connections.length).toBeGreaterThan(0);
        expect(body.data.connections[0]!.provider).toBe('google');
      });

      it('should reject unauthenticated request', async () => {
        const response = await request(app, 'GET', '/v1/auth/oauth/connections');

        expect(response.status).toBe(401);
      });
    });

    describe('POST /v1/auth/oauth/:provider/link', () => {
      it('should link additional provider to user', async () => {
        const response = await request(app, 'POST', '/v1/auth/oauth/facebook/link', {
          headers: { Authorization: `Bearer ${accessToken}` },
          body: { code: 'fb-link-code' },
        });

        expect(response.status).toBe(200);

        const body = await parseResponse<{
          statusCode: number;
          success: boolean;
          data: { provider: string; email: string | null; linkedAt: string };
        }>(response);

        expect(body.success).toBe(true);
        expect(body.data.provider).toBe('facebook');
      });

      it('should fail when provider already linked', async () => {
        const response = await request(app, 'POST', '/v1/auth/oauth/google/link', {
          headers: { Authorization: `Bearer ${accessToken}` },
          body: { code: 'google-link-code' },
        });

        expect(response.status).toBe(400);

        const body = await parseResponse<{
          success: boolean;
          error: string;
        }>(response);

        expect(body.success).toBe(false);
        // Error message is i18n-dependent, just check it exists
        expect(body.error).toBeDefined();
        expect(body.error.length).toBeGreaterThan(0);
      });

      it('should reject unauthenticated request', async () => {
        const response = await request(app, 'POST', '/v1/auth/oauth/facebook/link', {
          body: { code: 'fb-link-code' },
        });

        expect(response.status).toBe(401);
      });
    });

    describe('DELETE /v1/auth/oauth/:provider/unlink', () => {
      beforeEach(async () => {
        // Link Facebook so we have 2 providers
        await request(app, 'POST', '/v1/auth/oauth/facebook/link', {
          headers: { Authorization: `Bearer ${accessToken}` },
          body: { code: 'fb-to-unlink' },
        });
      });

      it('should unlink provider when user has multiple connections', async () => {
        const response = await request(app, 'DELETE', '/v1/auth/oauth/facebook/unlink', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        expect(response.status).toBe(200);

        const body = await parseResponse<{
          statusCode: number;
          success: boolean;
          message: string;
        }>(response);

        expect(body.success).toBe(true);
        // Message is i18n-dependent, just check it exists
        expect(body.message).toBeDefined();
        expect(body.message.length).toBeGreaterThan(0);
      });

      it('should fail when unlinking only authentication method', async () => {
        // First unlink Facebook
        await request(app, 'DELETE', '/v1/auth/oauth/facebook/unlink', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        // Try to unlink Google (last provider)
        const response = await request(app, 'DELETE', '/v1/auth/oauth/google/unlink', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        expect(response.status).toBe(400);

        const body = await parseResponse<{
          success: boolean;
          error: string;
        }>(response);

        expect(body.success).toBe(false);
        // Error message is i18n-dependent, just check it exists
        expect(body.error).toBeDefined();
        expect(body.error.length).toBeGreaterThan(0);
      });

      it('should reject unauthenticated request', async () => {
        const response = await request(app, 'DELETE', '/v1/auth/oauth/google/unlink');

        expect(response.status).toBe(401);
      });
    });
  });
});
