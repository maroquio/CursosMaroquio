import { SQL } from 'bun';
import { drizzle } from 'drizzle-orm/bun-sql';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import {
  usersTable,
  refreshTokensTable,
  rolesTable,
  permissionsTable,
  userRolesTable,
  rolePermissionsTable,
  userPermissionsTable,
} from '../../src/contexts/auth/infrastructure/persistence/drizzle/schema.ts';

/**
 * Integration Test Setup
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
export class IntegrationTestDatabaseProvider implements IDatabaseProvider {
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
      provider: new IntegrationTestDatabaseProvider(testDrizzleDb),
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
    provider: new IntegrationTestDatabaseProvider(drizzleDb),
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
 * Clear all data from test database
 * Order matters due to foreign key constraints
 */
export async function clearTestData(): Promise<void> {
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
  id: string,
  email: string,
  password = 'hashed_password',
  fullName = 'Test User',
  phone = '11999999999'
): Promise<void> {
  const db = getTestDb();
  await db.insert(usersTable).values({
    id,
    email,
    password,
    fullName,
    phone,
    createdAt: new Date(),
  });
}

/**
 * Create a test role directly in the database
 */
export async function createTestRole(
  id: string,
  name: string,
  description: string | null = null,
  isSystem = false
): Promise<void> {
  const db = getTestDb();
  await db.insert(rolesTable).values({
    id,
    name,
    description,
    isSystem,
    createdAt: new Date(),
  });
}

/**
 * Create a test permission directly in the database
 */
export async function createTestPermission(
  id: string,
  name: string,
  resource: string,
  action: string,
  description: string | null = null
): Promise<void> {
  const db = getTestDb();
  await db.insert(permissionsTable).values({
    id,
    name,
    resource,
    action,
    description,
    createdAt: new Date(),
  });
}

/**
 * Assign a role to a user directly in the database
 */
export async function assignTestRoleToUser(
  userId: string,
  roleId: string,
  assignedBy: string | null = null
): Promise<void> {
  const db = getTestDb();
  await db.insert(userRolesTable).values({
    userId,
    roleId,
    assignedAt: new Date(),
    assignedBy,
  });
}

/**
 * Assign a permission to a role directly in the database
 */
export async function assignTestPermissionToRole(
  roleId: string,
  permissionId: string,
  assignedBy: string | null = null
): Promise<void> {
  const db = getTestDb();
  await db.insert(rolePermissionsTable).values({
    roleId,
    permissionId,
    assignedAt: new Date(),
    assignedBy,
  });
}

/**
 * Assign a permission to a user directly in the database
 */
export async function assignTestPermissionToUser(
  userId: string,
  permissionId: string,
  assignedBy: string | null = null
): Promise<void> {
  const db = getTestDb();
  await db.insert(userPermissionsTable).values({
    userId,
    permissionId,
    assignedAt: new Date(),
    assignedBy,
  });
}
