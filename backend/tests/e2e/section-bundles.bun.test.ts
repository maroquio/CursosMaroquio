import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
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
  coursesTable,
  modulesTable,
  lessonsTable,
  sectionsTable,
  sectionBundlesTable,
} from '../../src/contexts/courses/infrastructure/persistence/drizzle/schema.ts';
import {
  usersTable,
  rolesTable,
  userRolesTable,
  permissionsTable,
  userPermissionsTable,
  rolePermissionsTable,
  refreshTokensTable,
} from '../../src/contexts/auth/infrastructure/persistence/drizzle/schema.ts';

// Test database URL
const TEST_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://app:app@localhost:5435/app_test';

// Store test database instance
let testSqlClient: SQL | null = null;
let testDrizzleDb: DrizzleDatabase | null = null;

/**
 * Test database provider
 */
class TestDatabaseProvider implements IDatabaseProvider {
  constructor(private database: DrizzleDatabase) {}
  getDb(): DrizzleDatabase {
    return this.database;
  }
}

/**
 * E2E Tests for Section Bundle Endpoints
 */
describe('Section Bundles E2E Tests', () => {
  let app: Elysia;

  beforeAll(async () => {
    await preloadAllLocales();

    // Create test database connection
    const sql = new SQL(TEST_DATABASE_URL);
    const drizzleDb = drizzle(sql);
    await sql.unsafe('SELECT 1');

    testSqlClient = sql;
    testDrizzleDb = drizzleDb;

    // Create app
    app = new Elysia();

    // Register i18n middleware
    app.use(i18nPlugin);

    // Global error handler
    app.onError(({ error, code, set, request }) => {
      const locale = localeDetector.detect(request);
      const t = getTranslatorSync(locale);

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

      if (code === 'NOT_FOUND') {
        set.status = 404;
        return { statusCode: 404, success: false, error: t.http.routeNotFound() };
      }

      return { statusCode: 500, success: false, error: String(error) };
    });

    // Register section bundle controller
    const sectionBundleController = Container.createSectionBundleAdminController();
    sectionBundleController.routes(app);

    // Register auth controller for login
    const authController = Container.createAuthController();
    authController.routes(app);
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
    if (testDrizzleDb) {
      // Clear data in order of dependencies
      await testDrizzleDb.delete(sectionBundlesTable);
      await testDrizzleDb.delete(sectionsTable);
      await testDrizzleDb.delete(lessonsTable);
      await testDrizzleDb.delete(modulesTable);
      await testDrizzleDb.delete(coursesTable);
      await testDrizzleDb.delete(userPermissionsTable);
      await testDrizzleDb.delete(rolePermissionsTable);
      await testDrizzleDb.delete(userRolesTable);
      await testDrizzleDb.delete(refreshTokensTable);
      await testDrizzleDb.delete(permissionsTable);
      await testDrizzleDb.delete(rolesTable);
      await testDrizzleDb.delete(usersTable);
    }
  });

  // Helper functions
  async function createAdminUser(): Promise<{ accessToken: string; userId: string }> {
    const userId = uuidv7();
    const email = `admin-${Date.now()}@test.com`;
    const password = 'SecureP@ss123';

    // Create user
    await testDrizzleDb!.insert(usersTable).values({
      id: userId,
      email,
      password: await Bun.password.hash(password),
      fullName: 'Admin User',
      phone: '11999999999',
      createdAt: new Date(),
    });

    // Create admin role
    const roleId = uuidv7();
    await testDrizzleDb!.insert(rolesTable).values({
      id: roleId,
      name: 'admin',
      description: 'Administrator',
      isSystem: true,
      createdAt: new Date(),
    });

    // Create courses:* permission
    const permissionId = uuidv7();
    await testDrizzleDb!.insert(permissionsTable).values({
      id: permissionId,
      name: 'courses:*',
      resource: 'courses',
      action: '*',
      description: 'Full access to courses',
      createdAt: new Date(),
    });

    // Assign role to user
    await testDrizzleDb!.insert(userRolesTable).values({
      userId,
      roleId,
      assignedAt: new Date(),
    });

    // Assign permission to role
    await testDrizzleDb!.insert(rolePermissionsTable).values({
      roleId,
      permissionId,
      assignedAt: new Date(),
    });

    // Login
    const loginResponse = await app.handle(
      new Request('http://localhost/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
    );

    const loginBody = (await loginResponse.json()) as { data: { accessToken: string } };
    return { accessToken: loginBody.data.accessToken, userId };
  }

  async function createTestSection(): Promise<{ sectionId: string; lessonId: string }> {
    const instructorId = uuidv7();
    await testDrizzleDb!.insert(usersTable).values({
      id: instructorId,
      email: `instructor-${Date.now()}@test.com`,
      password: 'hashed',
      fullName: 'Instructor',
      phone: '11999999999',
      createdAt: new Date(),
    });

    const courseId = uuidv7();
    await testDrizzleDb!.insert(coursesTable).values({
      id: courseId,
      title: 'Test Course',
      slug: `test-course-${Date.now()}`,
      description: 'Description',
      status: 'draft',
      instructorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const moduleId = uuidv7();
    await testDrizzleDb!.insert(modulesTable).values({
      id: moduleId,
      courseId,
      title: 'Test Module',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const lessonId = uuidv7();
    await testDrizzleDb!.insert(lessonsTable).values({
      id: lessonId,
      moduleId,
      title: 'Test Lesson',
      slug: `test-lesson-${lessonId}`,
      description: null,
      duration: 0,
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const sectionId = uuidv7();
    await testDrizzleDb!.insert(sectionsTable).values({
      id: sectionId,
      lessonId,
      title: 'Test Section',
      contentType: 'exercise',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { sectionId, lessonId };
  }

  async function createTestBundle(sectionId: string, version: number = 1, isActive: boolean = false): Promise<string> {
    const bundleId = uuidv7();
    await testDrizzleDb!.insert(sectionBundlesTable).values({
      id: bundleId,
      sectionId,
      version,
      entrypoint: 'index.html',
      storagePath: `bundles/sections/${sectionId}/v${version}`,
      isActive,
      createdAt: new Date(),
    });
    return bundleId;
  }

  // ===========================================================================
  // GET /v1/admin/sections/:sectionId/bundles
  // ===========================================================================
  describe('GET /v1/admin/sections/:sectionId/bundles', () => {
    it('should list bundles for a section', async () => {
      const { accessToken } = await createAdminUser();
      const { sectionId } = await createTestSection();

      await createTestBundle(sectionId, 1, false);
      await createTestBundle(sectionId, 2, true);

      const response = await app.handle(
        new Request(`http://localhost/v1/admin/sections/${sectionId}/bundles`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as { success: boolean; data: { sectionId: string; bundles: unknown[]; activeVersion: number } };
      expect(body.success).toBe(true);
      expect(body.data.sectionId).toBe(sectionId);
      expect(body.data.bundles).toHaveLength(2);
      expect(body.data.activeVersion).toBe(2);
    });

    it('should require authentication', async () => {
      const { sectionId } = await createTestSection();

      const response = await app.handle(
        new Request(`http://localhost/v1/admin/sections/${sectionId}/bundles`, {
          method: 'GET',
        })
      );

      const body = (await response.json()) as { success: boolean; statusCode: number };
      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(401);
    });
  });

  // ===========================================================================
  // POST /v1/admin/section-bundles/:bundleId/activate
  // ===========================================================================
  describe('POST /v1/admin/section-bundles/:bundleId/activate', () => {
    it('should activate a bundle', async () => {
      const { accessToken } = await createAdminUser();
      const { sectionId } = await createTestSection();

      const bundleId = await createTestBundle(sectionId, 1, false);

      const response = await app.handle(
        new Request(`http://localhost/v1/admin/section-bundles/${bundleId}/activate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as { success: boolean; data: { isActive: boolean } };
      expect(body.success).toBe(true);
      expect(body.data.isActive).toBe(true);
    });

    it('should fail when bundle is already active', async () => {
      const { accessToken } = await createAdminUser();
      const { sectionId } = await createTestSection();

      const bundleId = await createTestBundle(sectionId, 1, true);

      const response = await app.handle(
        new Request(`http://localhost/v1/admin/section-bundles/${bundleId}/activate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      );

      const body = (await response.json()) as { success: boolean; error: string };
      expect(body.success).toBe(false);
      expect(body.error).toContain('SECTION_BUNDLE_ALREADY_ACTIVE');
    });

    it('should fail when bundle does not exist', async () => {
      const { accessToken } = await createAdminUser();

      const response = await app.handle(
        new Request(`http://localhost/v1/admin/section-bundles/${uuidv7()}/activate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      );

      const body = (await response.json()) as { success: boolean };
      expect(body.success).toBe(false);
    });
  });

  // ===========================================================================
  // DELETE /v1/admin/section-bundles/:bundleId
  // ===========================================================================
  describe('DELETE /v1/admin/section-bundles/:bundleId', () => {
    it('should delete an inactive bundle', async () => {
      const { accessToken } = await createAdminUser();
      const { sectionId } = await createTestSection();

      const bundleId = await createTestBundle(sectionId, 1, false);

      const response = await app.handle(
        new Request(`http://localhost/v1/admin/section-bundles/${bundleId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as { success: boolean; message: string };
      expect(body.success).toBe(true);
      expect(body.message).toContain('deleted');
    });

    it('should fail when deleting active bundle', async () => {
      const { accessToken } = await createAdminUser();
      const { sectionId } = await createTestSection();

      const bundleId = await createTestBundle(sectionId, 1, true);

      const response = await app.handle(
        new Request(`http://localhost/v1/admin/section-bundles/${bundleId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      );

      const body = (await response.json()) as { success: boolean };
      expect(body.success).toBe(false);
    });
  });

  // ===========================================================================
  // GET /v1/sections/:sectionId/bundle (public)
  // ===========================================================================
  describe('GET /v1/sections/:sectionId/bundle', () => {
    it('should return active bundle for a section', async () => {
      const { sectionId } = await createTestSection();
      await createTestBundle(sectionId, 1, false);
      await createTestBundle(sectionId, 2, true);

      const response = await app.handle(
        new Request(`http://localhost/v1/sections/${sectionId}/bundle`, {
          method: 'GET',
        })
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as { success: boolean; data: { version: number; isActive: boolean } };
      expect(body.success).toBe(true);
      expect(body.data.version).toBe(2);
      expect(body.data.isActive).toBe(true);
    });

    it('should return 404 when no active bundle exists', async () => {
      const { sectionId } = await createTestSection();
      await createTestBundle(sectionId, 1, false);

      const response = await app.handle(
        new Request(`http://localhost/v1/sections/${sectionId}/bundle`, {
          method: 'GET',
        })
      );

      expect(response.status).toBe(404);
      const body = (await response.json()) as { success: boolean };
      expect(body.success).toBe(false);
    });

    it('should return 404 for non-existent section', async () => {
      const response = await app.handle(
        new Request(`http://localhost/v1/sections/${uuidv7()}/bundle`, {
          method: 'GET',
        })
      );

      expect(response.status).toBe(404);
    });
  });

  // Note: POST /v1/admin/sections/:sectionId/bundles (upload) is not tested here
  // because it requires multipart form data with actual file upload which is
  // complex to simulate in E2E tests. This endpoint should be tested manually
  // or with integration tests that mock the storage service.
});
