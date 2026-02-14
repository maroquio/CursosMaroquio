import { Elysia } from 'elysia';
import { SQL } from 'bun';
import { drizzle } from 'drizzle-orm/bun-sql';
import { v7 as uuidv7 } from 'uuid';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import { Container } from '../../src/infrastructure/di/Container.ts';
import {
  i18nPlugin,
  localeDetector,
  getTranslatorSync,
  preloadAllLocales,
} from '@shared/infrastructure/i18n/index.js';
import { ValidationErrorMapper } from '@shared/infrastructure/validation/ValidationErrorMapper.ts';
import {
  usersTable,
  refreshTokensTable,
  rolesTable,
  permissionsTable,
  userRolesTable,
  rolePermissionsTable,
  userPermissionsTable,
} from '../../src/contexts/auth/infrastructure/persistence/drizzle/schema.ts';

// Infrastructure imports for controller creation
import { DrizzleUserRepository } from '../../src/contexts/auth/infrastructure/persistence/drizzle/DrizzleUserRepository.ts';
import { DrizzleRefreshTokenRepository } from '../../src/contexts/auth/infrastructure/persistence/drizzle/DrizzleRefreshTokenRepository.ts';
import { DrizzleRoleRepository } from '../../src/contexts/auth/infrastructure/persistence/drizzle/DrizzleRoleRepository.ts';
import { DrizzlePermissionRepository } from '../../src/contexts/auth/infrastructure/persistence/drizzle/DrizzlePermissionRepository.ts';
import { BunPasswordHasher } from '../../src/contexts/auth/infrastructure/services/BunPasswordHasher.ts';
import { JwtTokenService } from '../../src/contexts/auth/infrastructure/services/JwtTokenService.ts';
import { PermissionService } from '../../src/contexts/auth/infrastructure/services/PermissionService.ts';

// Handlers
import { RegisterUserHandler } from '../../src/contexts/auth/application/commands/register-user/RegisterUserHandler.ts';
import { GetUserHandler } from '../../src/contexts/auth/application/queries/get-user/GetUserHandler.ts';
import { LoginHandler } from '../../src/contexts/auth/application/commands/login/LoginHandler.ts';
import { RefreshTokenHandler } from '../../src/contexts/auth/application/commands/refresh-token/RefreshTokenHandler.ts';
import { LogoutHandler } from '../../src/contexts/auth/application/commands/logout/LogoutHandler.ts';
import { AssignRoleHandler } from '../../src/contexts/auth/application/commands/assign-role/AssignRoleHandler.ts';
import { RemoveRoleHandler } from '../../src/contexts/auth/application/commands/remove-role/RemoveRoleHandler.ts';
import { CreateRoleHandler } from '../../src/contexts/auth/application/commands/create-role/CreateRoleHandler.ts';
import { UpdateRoleHandler } from '../../src/contexts/auth/application/commands/update-role/UpdateRoleHandler.ts';
import { DeleteRoleHandler } from '../../src/contexts/auth/application/commands/delete-role/DeleteRoleHandler.ts';
import { ListRolesHandler } from '../../src/contexts/auth/application/queries/list-roles/ListRolesHandler.ts';
import { CreatePermissionHandler } from '../../src/contexts/auth/application/commands/create-permission/CreatePermissionHandler.ts';
import { ListPermissionsHandler } from '../../src/contexts/auth/application/queries/list-permissions/ListPermissionsHandler.ts';
import { AssignPermissionToRoleHandler } from '../../src/contexts/auth/application/commands/assign-permission-to-role/AssignPermissionToRoleHandler.ts';
import { RemovePermissionFromRoleHandler } from '../../src/contexts/auth/application/commands/remove-permission-from-role/RemovePermissionFromRoleHandler.ts';
import { AssignPermissionToUserHandler } from '../../src/contexts/auth/application/commands/assign-permission-to-user/AssignPermissionToUserHandler.ts';
import { RemovePermissionFromUserHandler } from '../../src/contexts/auth/application/commands/remove-permission-from-user/RemovePermissionFromUserHandler.ts';
import { GetUserPermissionsHandler } from '../../src/contexts/auth/application/queries/get-user-permissions/GetUserPermissionsHandler.ts';

// User Admin Handlers
import { ListUsersHandler } from '../../src/contexts/auth/application/queries/list-users/ListUsersHandler.ts';
import { GetUserAdminHandler } from '../../src/contexts/auth/application/queries/get-user-admin/GetUserAdminHandler.ts';
import { CreateUserAdminHandler } from '../../src/contexts/auth/application/commands/create-user-admin/CreateUserAdminHandler.ts';
import { UpdateUserAdminHandler } from '../../src/contexts/auth/application/commands/update-user-admin/UpdateUserAdminHandler.ts';
import { DeactivateUserHandler } from '../../src/contexts/auth/application/commands/deactivate-user/DeactivateUserHandler.ts';
import { ActivateUserHandler } from '../../src/contexts/auth/application/commands/activate-user/ActivateUserHandler.ts';
import { ResetPasswordAdminHandler } from '../../src/contexts/auth/application/commands/reset-password-admin/ResetPasswordAdminHandler.ts';

// Controllers
import { AuthController } from '../../src/contexts/auth/presentation/http/AuthController.ts';
import { RoleController } from '../../src/contexts/auth/presentation/http/RoleController.ts';
import { PermissionController } from '../../src/contexts/auth/presentation/http/PermissionController.ts';
import { UserAdminController } from '../../src/contexts/auth/presentation/http/UserAdminController.ts';
import { UserRoleController } from '../../src/contexts/auth/presentation/http/UserRoleController.ts';

/**
 * E2E Test Setup
 * Creates an isolated test environment with PostgreSQL test database
 */

// Test database URL
const TEST_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://app:app@localhost:5435/app_test';

// Store test database instance
let testSqlClient: SQL | null = null;
let testDrizzleDb: DrizzleDatabase | null = null;

/**
 * Create test database provider
 */
class TestDatabaseProvider implements IDatabaseProvider {
  constructor(private database: DrizzleDatabase) {}
  getDb(): DrizzleDatabase {
    return this.database;
  }
}

/**
 * Initialize test database connection
 */
export async function createTestDatabase(): Promise<{ db: DrizzleDatabase; sql: SQL }> {
  const sql = new SQL(TEST_DATABASE_URL);
  const drizzleDb = drizzle(sql);

  // Ensure schema exists (tables should be created via db:push before tests)
  // Just verify connection is working
  await sql.unsafe('SELECT 1');

  return { db: drizzleDb, sql };
}

/**
 * Create test application instance with all controllers
 */
export async function createTestApp(): Promise<Elysia> {
  // Preload all i18n locales before creating app
  // Required for getTranslatorSync in error handlers
  await preloadAllLocales();

  // Create fresh test database connection
  const { db, sql } = await createTestDatabase();
  testSqlClient = sql;
  testDrizzleDb = db;

  // Clear data before each test
  await clearTestDatabase();

  // Create test container with test database
  const testProvider = new TestDatabaseProvider(db);

  // Create application with test dependencies
  const app = new Elysia();

  // Register i18n middleware for locale detection and translations
  app.use(i18nPlugin);

  // Global error handler with i18n support (mirrors main.ts)
  app.onError(({ error, code, set, request }) => {
    // Detect locale from request for localized error messages
    const locale = localeDetector.detect(request);
    const t = getTranslatorSync(locale);

    // Handle validation errors specifically with i18n support
    // Uses 422 Unprocessable Entity (RFC 4918) - semantically correct for validation errors
    if (code === 'VALIDATION') {
      const mapper = new ValidationErrorMapper(t);
      const errors = mapper.mapElysiaError(error);

      set.status = 422;
      return {
        statusCode: 422,
        success: false,
        message: t.common.validationError(),
        errors,
      };
    }

    // Handle not found errors
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return {
        statusCode: 404,
        success: false,
        error: t.http.routeNotFound(),
      };
    }

    return {
      statusCode: 500,
      success: false,
      error: String(error),
    };
  });

  // Health check endpoints
  app
    .get('/', (ctx: any) => ({
      message: ctx.t.http.welcome(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      locale: ctx.locale,
    }))
    .get('/health', () => ({
      status: 'ok',
      timestamp: Date.now(),
      uptime: process.uptime(),
      checks: {
        database: 'healthy',
      },
    }));

  // Create all controllers with test dependencies
  const { authController, roleController, userRoleController, permissionController, userAdminController } =
    createControllersWithProvider(testProvider);

  // Register all routes
  authController.routes(app);
  roleController.routes(app);
  userRoleController.routes(app);
  permissionController.routes(app);
  userAdminController.routes(app);

  return app;
}

/**
 * Create all controllers with a custom database provider
 * Used for testing with isolated test database
 */
function createControllersWithProvider(dbProvider: IDatabaseProvider) {
  // Repositories
  const roleRepository = new DrizzleRoleRepository(dbProvider);
  const permissionRepository = new DrizzlePermissionRepository(dbProvider);
  const userRepository = new DrizzleUserRepository(dbProvider, roleRepository);
  const refreshTokenRepository = new DrizzleRefreshTokenRepository(dbProvider);

  // Services
  const passwordHasher = new BunPasswordHasher();
  const tokenService = new JwtTokenService();
  const permissionService = new PermissionService(permissionRepository, roleRepository);

  // Auth Handlers
  const registerUserHandler = new RegisterUserHandler(userRepository, passwordHasher);
  const getUserHandler = new GetUserHandler(userRepository);
  const loginHandler = new LoginHandler(
    userRepository,
    refreshTokenRepository,
    passwordHasher,
    tokenService
  );
  const refreshTokenHandler = new RefreshTokenHandler(
    userRepository,
    refreshTokenRepository,
    tokenService
  );
  const logoutHandler = new LogoutHandler(refreshTokenRepository);

  // Role Handlers
  const assignRoleHandler = new AssignRoleHandler(userRepository, roleRepository);
  const removeRoleHandler = new RemoveRoleHandler(userRepository);
  const createRoleHandler = new CreateRoleHandler(userRepository, roleRepository);
  const updateRoleHandler = new UpdateRoleHandler(userRepository, roleRepository);
  const deleteRoleHandler = new DeleteRoleHandler(userRepository, roleRepository);
  const listRolesHandler = new ListRolesHandler(roleRepository);

  // Permission Handlers
  const createPermissionHandler = new CreatePermissionHandler(userRepository, permissionRepository);
  const listPermissionsHandler = new ListPermissionsHandler(permissionRepository);
  const assignPermissionToRoleHandler = new AssignPermissionToRoleHandler(
    userRepository,
    roleRepository,
    permissionRepository
  );
  const removePermissionFromRoleHandler = new RemovePermissionFromRoleHandler(
    userRepository,
    roleRepository,
    permissionRepository
  );
  const assignPermissionToUserHandler = new AssignPermissionToUserHandler(
    userRepository,
    permissionRepository,
    permissionService
  );
  const removePermissionFromUserHandler = new RemovePermissionFromUserHandler(
    userRepository,
    permissionRepository,
    permissionService
  );
  const getUserPermissionsHandler = new GetUserPermissionsHandler(
    userRepository,
    permissionService
  );

  // Create Controllers
  const authController = new AuthController(
    registerUserHandler,
    getUserHandler,
    loginHandler,
    refreshTokenHandler,
    logoutHandler,
    tokenService
  );

  const roleController = new RoleController(
    roleRepository,
    tokenService,
    createRoleHandler,
    updateRoleHandler,
    deleteRoleHandler,
    listRolesHandler,
    assignPermissionToRoleHandler,
    removePermissionFromRoleHandler
  );

  const permissionController = new PermissionController(
    tokenService,
    createPermissionHandler,
    listPermissionsHandler,
    getUserPermissionsHandler,
    assignPermissionToUserHandler,
    removePermissionFromUserHandler
  );

  // User Admin Handlers
  const listUsersHandler = new ListUsersHandler(userRepository);
  const getUserAdminHandler = new GetUserAdminHandler(userRepository);
  const createUserAdminHandler = new CreateUserAdminHandler(
    userRepository,
    roleRepository,
    passwordHasher
  );
  const updateUserAdminHandler = new UpdateUserAdminHandler(userRepository);
  const deactivateUserHandler = new DeactivateUserHandler(userRepository);
  const activateUserHandler = new ActivateUserHandler(userRepository);
  const resetPasswordAdminHandler = new ResetPasswordAdminHandler(userRepository, passwordHasher);

  const userRoleController = new UserRoleController(
    tokenService,
    assignRoleHandler,
    removeRoleHandler,
    roleRepository
  );

  const userAdminController = new UserAdminController(
    tokenService,
    listUsersHandler,
    getUserAdminHandler,
    createUserAdminHandler,
    updateUserAdminHandler,
    deactivateUserHandler,
    activateUserHandler,
    resetPasswordAdminHandler
  );

  return { authController, roleController, userRoleController, permissionController, userAdminController };
}

/**
 * Cleanup test database connection
 */
export async function cleanupTestDatabase(): Promise<void> {
  if (testSqlClient) {
    try {
      await testSqlClient.close();
    } catch {
      // Ignore errors
    }
    testSqlClient = null;
    testDrizzleDb = null;
  }
}

/**
 * Clear all data from test database
 * Order matters due to foreign key constraints
 */
export async function clearTestDatabase(): Promise<void> {
  if (testDrizzleDb) {
    // Clear junction tables first (they have FK to main tables)
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
 * Seed the admin role and optionally create admin user
 * Call this in tests that need admin functionality
 */
export async function seedAdminRole(): Promise<string> {
  if (!testDrizzleDb) {
    throw new Error('Test database not initialized');
  }

  const roleId = uuidv7();
  await testDrizzleDb.insert(rolesTable).values({
    id: roleId,
    name: 'admin',
    description: 'System administrator with full access',
    isSystem: true,
    createdAt: new Date(),
  });

  return roleId;
}

/**
 * Seed a custom role
 */
export async function seedRole(
  name: string,
  description?: string,
  isSystem = false
): Promise<string> {
  if (!testDrizzleDb) {
    throw new Error('Test database not initialized');
  }

  const roleId = uuidv7();
  await testDrizzleDb.insert(rolesTable).values({
    id: roleId,
    name,
    description: description ?? null,
    isSystem,
    createdAt: new Date(),
  });

  return roleId;
}

/**
 * Assign a role to a user
 */
export async function assignRoleToUser(userId: string, roleId: string): Promise<void> {
  if (!testDrizzleDb) {
    throw new Error('Test database not initialized');
  }

  await testDrizzleDb.insert(userRolesTable).values({
    userId,
    roleId,
    assignedAt: new Date(),
  });
}

/**
 * Create a permission in the database
 */
export async function seedPermission(name: string, description?: string): Promise<string> {
  if (!testDrizzleDb) {
    throw new Error('Test database not initialized');
  }

  const [resource, action] = name.split(':');
  const permissionId = uuidv7();

  await testDrizzleDb.insert(permissionsTable).values({
    id: permissionId,
    name,
    resource: resource || name,
    action: action || 'access',
    description: description ?? null,
    createdAt: new Date(),
  });

  return permissionId;
}

/**
 * Helper to make HTTP requests to test app
 */
export async function request(
  app: Elysia,
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
    'Accept-Language': 'en-US', // Default to English for E2E tests
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
export async function parseResponse<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

/**
 * Test user credentials for E2E tests
 */
export const testUser = {
  email: 'e2e-test@example.com',
  password: 'SecureP@ss123',
  fullName: 'Test User',
  phone: '11999998888',
};

/**
 * Helper to register a test user
 */
export async function registerTestUser(
  app: Elysia,
  user = testUser
): Promise<{ success: boolean; statusCode: number }> {
  const response = await request(app, 'POST', '/v1/auth/register', {
    body: {
      email: user.email,
      password: user.password,
      fullName: user.fullName || 'Test User',
      phone: user.phone || '11999998888',
    },
  });
  return parseResponse(response);
}

/**
 * Helper to login and get tokens
 */
export async function loginTestUser(
  app: Elysia,
  user = testUser
): Promise<{
  success: boolean;
  statusCode: number;
  data?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: { id: string; email: string };
  };
  error?: string;
}> {
  const response = await request(app, 'POST', '/v1/auth/login', {
    body: { email: user.email, password: user.password },
  });
  return parseResponse(response);
}

/**
 * Generate unique email for parallel tests
 */
export function uniqueEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Admin test user credentials
 */
export const adminUser = {
  email: 'admin-test@example.com',
  password: 'AdminP@ss123',
  fullName: 'Admin User',
  phone: '11999997777',
};

/**
 * Create an admin user (register, seed role, assign role)
 * Returns the access token for authenticated requests
 */
export async function createAdminUser(
  app: Elysia,
  user = adminUser
): Promise<{
  accessToken: string;
  userId: string;
  roleId: string;
}> {
  // Register the user
  await request(app, 'POST', '/v1/auth/register', {
    body: {
      email: user.email,
      password: user.password,
      fullName: user.fullName || 'Admin User',
      phone: user.phone || '11999997777',
    },
  });

  // Login to get tokens and userId
  const loginResponse = await request(app, 'POST', '/v1/auth/login', {
    body: { email: user.email, password: user.password },
  });

  const loginBody = await parseResponse<{
    data: { accessToken: string; user: { id: string } };
  }>(loginResponse);

  const userId = loginBody.data.user.id;

  // Seed admin role and assign to user
  const roleId = await seedAdminRole();
  await assignRoleToUser(userId, roleId);

  // Login again to get new token with admin role
  const adminLoginResponse = await request(app, 'POST', '/v1/auth/login', {
    body: { email: user.email, password: user.password },
  });

  const adminLoginBody = await parseResponse<{
    data: { accessToken: string };
  }>(adminLoginResponse);

  return {
    accessToken: adminLoginBody.data.accessToken,
    userId,
    roleId,
  };
}

/**
 * Create a regular (non-admin) user
 * Returns the access token for authenticated requests
 */
export async function createRegularUser(
  app: Elysia,
  email = uniqueEmail(),
  password = 'UserP@ss123',
  fullName = 'Regular User',
  phone = '11999996666'
): Promise<{
  accessToken: string;
  userId: string;
}> {
  // Register the user
  await request(app, 'POST', '/v1/auth/register', {
    body: { email, password, fullName, phone },
  });

  // Login to get tokens
  const loginResponse = await request(app, 'POST', '/v1/auth/login', {
    body: { email, password },
  });

  const loginBody = await parseResponse<{
    data: { accessToken: string; user: { id: string } };
  }>(loginResponse);

  return {
    accessToken: loginBody.data.accessToken,
    userId: loginBody.data.user.id,
  };
}
