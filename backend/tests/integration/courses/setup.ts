import { SQL } from 'bun';
import { drizzle } from 'drizzle-orm/bun-sql';
import { v7 as uuidv7 } from 'uuid';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import {
  coursesTable,
  modulesTable,
  lessonsTable,
  sectionsTable,
  sectionBundlesTable,
} from '../../../src/contexts/courses/infrastructure/persistence/drizzle/schema.ts';
import {
  usersTable,
} from '../../../src/contexts/auth/infrastructure/persistence/drizzle/schema.ts';

/**
 * Integration Test Setup for Courses Context
 * Provides database connection and helpers for repository integration tests
 */

// Test database URL
const TEST_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://app:app@localhost:5435/app_test';

// Store test database instance
let testSqlClient: SQL | null = null;
let testDrizzleDb: DrizzleDatabase | null = null;

/**
 * Test database provider implementation
 */
export class CoursesIntegrationTestDatabaseProvider implements IDatabaseProvider {
  constructor(private database: DrizzleDatabase) {}
  getDb(): DrizzleDatabase {
    return this.database;
  }
}

/**
 * Initialize test database connection
 */
export async function initTestDatabase(): Promise<{
  db: DrizzleDatabase;
  provider: IDatabaseProvider;
}> {
  if (testDrizzleDb) {
    return {
      db: testDrizzleDb,
      provider: new CoursesIntegrationTestDatabaseProvider(testDrizzleDb),
    };
  }

  const sql = new SQL(TEST_DATABASE_URL);
  const drizzleDb = drizzle(sql);

  // Verify connection
  await sql.unsafe('SELECT 1');

  testSqlClient = sql;
  testDrizzleDb = drizzleDb;

  return {
    db: drizzleDb,
    provider: new CoursesIntegrationTestDatabaseProvider(drizzleDb),
  };
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
 * Clear all courses data from test database
 * Order matters due to foreign key constraints
 */
export async function clearTestData(): Promise<void> {
  if (testDrizzleDb) {
    // Clear in order of dependencies (children first)
    await testDrizzleDb.delete(sectionBundlesTable);
    await testDrizzleDb.delete(sectionsTable);
    await testDrizzleDb.delete(lessonsTable);
    await testDrizzleDb.delete(modulesTable);
    await testDrizzleDb.delete(coursesTable);
    // Clear users last (may be referenced by courses)
    await testDrizzleDb.delete(usersTable);
  }
}

/**
 * Get the test database instance
 */
export function getTestDb(): DrizzleDatabase {
  if (!testDrizzleDb) {
    throw new Error('Test database not initialized. Call initTestDatabase() first.');
  }
  return testDrizzleDb;
}

/**
 * Create a test user directly in the database
 */
export async function createTestUser(
  id: string = uuidv7(),
  email: string = `test-${Date.now()}@example.com`
): Promise<string> {
  const db = getTestDb();
  await db.insert(usersTable).values({
    id,
    email,
    password: 'hashed_password',
    fullName: 'Test User',
    phone: '11999999999',
    createdAt: new Date(),
  });
  return id;
}

/**
 * Create a test course directly in the database
 */
export async function createTestCourse(
  id: string = uuidv7(),
  instructorId: string
): Promise<string> {
  const db = getTestDb();
  await db.insert(coursesTable).values({
    id,
    title: `Test Course ${Date.now()}`,
    slug: `test-course-${Date.now()}`,
    description: 'Test course description',
    status: 'draft',
    instructorId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

/**
 * Create a test module directly in the database
 */
export async function createTestModule(
  id: string = uuidv7(),
  courseId: string,
  order: number = 1
): Promise<string> {
  const db = getTestDb();
  await db.insert(modulesTable).values({
    id,
    courseId,
    title: `Test Module ${Date.now()}`,
    description: null,
    order,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

/**
 * Create a test lesson directly in the database
 */
export async function createTestLesson(
  id: string = uuidv7(),
  moduleId: string,
  order: number = 1
): Promise<string> {
  const db = getTestDb();
  await db.insert(lessonsTable).values({
    id,
    moduleId,
    title: `Test Lesson ${Date.now()}`,
    slug: `test-lesson-${id}`,
    description: null,
    order,
    duration: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

/**
 * Create a test section directly in the database
 */
export async function createTestSection(
  id: string = uuidv7(),
  lessonId: string,
  contentType: 'text' | 'video' | 'quiz' | 'exercise' = 'text',
  order: number = 1
): Promise<string> {
  const db = getTestDb();
  await db.insert(sectionsTable).values({
    id,
    lessonId,
    title: `Test Section ${Date.now()}`,
    description: null,
    contentType,
    order,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

/**
 * Create a test section bundle directly in the database
 */
export async function createTestSectionBundle(
  id: string = uuidv7(),
  sectionId: string,
  version: number = 1,
  isActive: boolean = false
): Promise<string> {
  const db = getTestDb();
  await db.insert(sectionBundlesTable).values({
    id,
    sectionId,
    version,
    entrypoint: 'index.html',
    storagePath: `bundles/sections/${sectionId}/v${version}`,
    manifestJson: null,
    isActive,
    createdAt: new Date(),
  });
  return id;
}

/**
 * Generate a new UUID v7
 */
export function generateId(): string {
  return uuidv7();
}
