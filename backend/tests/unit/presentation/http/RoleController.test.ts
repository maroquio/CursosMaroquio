import { describe, it, expect, beforeEach } from 'vitest';
import { Elysia } from 'elysia';
import { RoleController } from '@auth/presentation/http/RoleController.ts';
import type { IRoleRepository } from '@auth/domain/repositories/IRoleRepository.ts';
import type { ITokenService, TokenPayload } from '@auth/domain/services/ITokenService.ts';
import type { CreateRoleHandler } from '@auth/application/commands/create-role/CreateRoleHandler.ts';
import { Role } from '@auth/domain/value-objects/Role.ts';
import { RoleId } from '@auth/domain/value-objects/RoleId.ts';
import { Result } from '@shared/domain/Result.ts';
import type { UserId } from '@auth/domain/value-objects/UserId.ts';
import { ErrorCode, getErrorMessage } from '@shared/domain/errors/ErrorCodes.ts';
import { i18nPlugin } from '@shared/infrastructure/i18n/index.js';

// Type helpers for response bodies
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RoleData {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Tests for RoleController fallback behavior
 * Specifically tests the code path when listRolesHandler is not provided
 */

// Mock token service that validates admin tokens
const mockTokenService: ITokenService = {
  generateAccessToken: (_userId: UserId, _email: string, _roles: string[]) => 'access-token',
  verifyAccessToken: (token: string): TokenPayload | null => {
    const now = Math.floor(Date.now() / 1000);
    if (token === 'admin-token') {
      return {
        userId: '019b24a8-c19c-7566-bf27-103fb4029456',
        email: 'admin@test.com',
        roles: ['admin'],
        iat: now,
        exp: now + 900,
      };
    }
    return null;
  },
  getAccessTokenExpiryMs: () => 900000,
  getRefreshTokenExpiryMs: () => 604800000,
};

// Mock role repository that returns test roles
function createMockRoleRepository(): IRoleRepository {
  const testRoles = [
    {
      id: RoleId.create(),
      name: 'admin',
      description: 'Administrator role',
      isSystem: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      permissions: [],
    },
    {
      id: RoleId.create(),
      name: 'user',
      description: 'Regular user role',
      isSystem: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: null,
      permissions: [],
    },
  ];

  return {
    findById: async () => null,
    findByName: async () => null,
    findAll: async () => testRoles as any,
    findAllPaginated: async () => ({ roles: testRoles as any, total: 2, page: 1, limit: 20, totalPages: 1 }),
    save: async () => {},
    update: async () => {},
    delete: async () => {},
    existsByName: async () => false,
    findByUserId: async () => [],
    assignRoleToUser: async () => {},
    removeRoleFromUser: async () => {},
    userHasRole: async () => false,
    findPermissionsByRoleId: async () => [],
    assignPermissionToRole: async () => {},
    removePermissionFromRole: async () => {},
    roleHasPermission: async () => false,
    setRolePermissions: async () => {},
  };
}

// Minimal mock handlers (required by constructor but not used in fallback path)
const mockCreateRoleHandler = {
  execute: async () => ({ isFailure: false, isSuccess: true, getValue: () => undefined, getError: () => null }),
} as unknown as CreateRoleHandler;

describe('RoleController Fallback Behavior', () => {
  let app: ReturnType<typeof Elysia.prototype.use>;
  let roleRepository: IRoleRepository;

  beforeEach(() => {
    roleRepository = createMockRoleRepository();

    // Create controller WITHOUT listRolesHandler to trigger fallback path
    const controller = new RoleController(
      roleRepository,
      mockTokenService
      // Note: listRolesHandler is NOT provided - this triggers the fallback path
    );

    app = new Elysia()
      .use(i18nPlugin);
    controller.routes(app);
  });

  describe('GET /v1/roles (fallback path)', () => {
    it('should list roles using repository fallback when listRolesHandler is not provided', async () => {
      const response = await app.handle(
        new Request('http://localhost/v1/roles', {
          headers: {
            Authorization: 'Bearer admin-token',
          },
        })
      );

      expect(response.status).toBe(200);

      const body = await response.json() as ApiResponse<RoleData[]>;
      expect(body.success).toBe(true);
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data!.length).toBe(2);
    });

    it('should transform role entities correctly in fallback path', async () => {
      const response = await app.handle(
        new Request('http://localhost/v1/roles', {
          headers: {
            Authorization: 'Bearer admin-token',
          },
        })
      );

      const body = await response.json() as ApiResponse<RoleData[]>;
      const adminRole = body.data!.find((r: any) => r.name === 'admin');

      expect(adminRole).toBeDefined();
      expect(adminRole!.id).toBeDefined();
      expect(adminRole!.name).toBe('admin');
      expect(adminRole!.description).toBe('Administrator role');
      expect(adminRole!.isSystem).toBe(true);
      expect(adminRole!.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(adminRole!.updatedAt).toBe('2024-01-02T00:00:00.000Z');
    });

    it('should handle null updatedAt in fallback path', async () => {
      const response = await app.handle(
        new Request('http://localhost/v1/roles', {
          headers: {
            Authorization: 'Bearer admin-token',
          },
        })
      );

      const body = await response.json() as ApiResponse<RoleData[]>;
      const userRole = body.data!.find((r: any) => r.name === 'user');

      expect(userRole).toBeDefined();
      expect(userRole!.updatedAt).toBeNull();
    });

    it('should reject unauthenticated requests', async () => {
      const response = await app.handle(new Request('http://localhost/v1/roles'));

      expect(response.status).toBe(401);
    });

    it('should reject non-admin users', async () => {
      // Create a token service that returns non-admin user
      const now = Math.floor(Date.now() / 1000);
      const nonAdminTokenService: ITokenService = {
        ...mockTokenService,
        verifyAccessToken: () => ({
          userId: '019b24a8-c19c-7566-bf27-103fb4029456',
          email: 'user@test.com',
          roles: ['user'], // Not admin
          iat: now,
          exp: now + 900,
        }),
      };

      const controller = new RoleController(
        roleRepository,
        nonAdminTokenService
      );

      const testApp = new Elysia()
        .use(i18nPlugin);
      controller.routes(testApp);

      const response = await testApp.handle(
        new Request('http://localhost/v1/roles', {
          headers: {
            Authorization: 'Bearer user-token',
          },
        })
      );

      expect(response.status).toBe(403);
    });
  });

  describe('Fallback path data mapping', () => {
    it('should map all role properties correctly', async () => {
      const response = await app.handle(
        new Request('http://localhost/v1/roles', {
          headers: {
            Authorization: 'Bearer admin-token',
          },
        })
      );

      const body = await response.json() as ApiResponse<RoleData[]>;

      // Verify all roles have the expected shape
      for (const role of body.data!) {
        expect(typeof role.id).toBe('string');
        expect(typeof role.name).toBe('string');
        expect(role.description === null || typeof role.description === 'string').toBe(true);
        expect(typeof role.isSystem).toBe('boolean');
        expect(typeof role.createdAt).toBe('string');
        expect(role.updatedAt === null || typeof role.updatedAt === 'string').toBe(true);
      }
    });
  });
});

/**
 * Tests for RoleController edge cases in POST /v1/roles
 * These tests cover defensive error handling paths
 */
describe('RoleController Edge Cases', () => {
  describe('POST /v1/roles', () => {
    it('should return 500 when createRoleHandler returns invalid roleId', async () => {
      // Mock handler that returns an invalid roleId (not a valid UUID)
      const mockCreateRoleHandlerWithInvalidId = {
        execute: async () => Result.ok({ roleId: 'invalid-not-a-uuid' }),
      } as unknown as CreateRoleHandler;

      const roleRepository = createMockRoleRepository();

      const controller = new RoleController(
        roleRepository,
        mockTokenService,
        mockCreateRoleHandlerWithInvalidId // createRoleHandler
      );

      const app = new Elysia()
        .use(i18nPlugin);
      controller.routes(app);

      const response = await app.handle(
        new Request('http://localhost/v1/roles', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer admin-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: 'testrole', description: 'Test role' }),
        })
      );

      expect(response.status).toBe(500);

      const body = await response.json() as ApiResponse;
      expect(body.success).toBe(false);
      // Error message comes from i18n (t.id.invalidRoleId()), so just check it exists
      expect(body.error).toBeDefined();
      expect(typeof body.error).toBe('string');
    });

    it('should return 500 when role not found after creation', async () => {
      // Mock handler that returns a valid roleId
      const validRoleId = RoleId.create();
      const mockCreateRoleHandlerSuccess = {
        execute: async () => Result.ok({ roleId: validRoleId.toValue() }),
      } as unknown as CreateRoleHandler;

      // Mock repository where findById always returns null (role not found)
      const roleRepositoryWithNullFind: IRoleRepository = {
        ...createMockRoleRepository(),
        findById: async () => null, // Always return null
      };

      const controller = new RoleController(
        roleRepositoryWithNullFind,
        mockTokenService,
        mockCreateRoleHandlerSuccess // createRoleHandler
      );

      const app = new Elysia()
        .use(i18nPlugin);
      controller.routes(app);

      const response = await app.handle(
        new Request('http://localhost/v1/roles', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer admin-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: 'testrole', description: 'Test role' }),
        })
      );

      expect(response.status).toBe(500);

      const body = await response.json() as ApiResponse;
      expect(body.success).toBe(false);
      // Error message comes from i18n (t.auth.role.notFound()), so just check it exists
      expect(body.error).toBeDefined();
      expect(typeof body.error).toBe('string');
    });

    it('should return 501 when createRoleHandler is not provided', async () => {
      const roleRepository = createMockRoleRepository();

      // Controller without createRoleHandler
      const controller = new RoleController(
        roleRepository,
        mockTokenService
        // createRoleHandler is NOT provided
      );

      const app = new Elysia()
        .use(i18nPlugin);
      controller.routes(app);

      const response = await app.handle(
        new Request('http://localhost/v1/roles', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer admin-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: 'testrole' }),
        })
      );

      expect(response.status).toBe(501);

      const body = await response.json() as ApiResponse;
      expect(body.success).toBe(false);
      // Error message comes from i18n (t.common.notImplemented()), so just check it exists
      expect(body.error).toBeDefined();
      expect(typeof body.error).toBe('string');
    });

    it('should return 400 when createRoleHandler fails', async () => {
      const mockCreateRoleHandlerFailure = {
        execute: async () => Result.fail('Role name already exists'),
      } as unknown as CreateRoleHandler;

      const roleRepository = createMockRoleRepository();

      const controller = new RoleController(
        roleRepository,
        mockTokenService,
        mockCreateRoleHandlerFailure
      );

      const app = new Elysia()
        .use(i18nPlugin);
      controller.routes(app);

      const response = await app.handle(
        new Request('http://localhost/v1/roles', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer admin-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: 'admin' }),
        })
      );

      expect(response.status).toBe(400);

      const body = await response.json() as ApiResponse;
      expect(body.success).toBe(false);
      expect(body.error).toBe('Role name already exists');
    });

    it('should return 201 when role is created successfully', async () => {
      const validRoleId = RoleId.create();
      const mockCreateRoleHandlerSuccess = {
        execute: async () => Result.ok({ roleId: validRoleId.toValue() }),
      } as unknown as CreateRoleHandler;

      const createdRole = {
        id: validRoleId,
        name: 'newrole',
        description: 'A new test role',
        isSystem: false,
        createdAt: new Date('2024-06-01'),
        updatedAt: null,
        permissions: [],
      };

      // Mock repository that returns the created role
      const roleRepositoryWithRole: IRoleRepository = {
        ...createMockRoleRepository(),
        findById: async () => createdRole as any,
      };

      const controller = new RoleController(
        roleRepositoryWithRole,
        mockTokenService,
        mockCreateRoleHandlerSuccess
      );

      const app = new Elysia()
        .use(i18nPlugin);
      controller.routes(app);

      const response = await app.handle(
        new Request('http://localhost/v1/roles', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer admin-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: 'newrole', description: 'A new test role' }),
        })
      );

      expect(response.status).toBe(201);

      const body = await response.json() as ApiResponse<RoleData>;
      expect(body.success).toBe(true);
      expect(body.data!.name).toBe('newrole');
      expect(body.data!.description).toBe('A new test role');
      expect(body.data!.isSystem).toBe(false);
    });
  });
});
