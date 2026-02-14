import { SQL } from 'bun';
import { drizzle } from 'drizzle-orm/bun-sql';
import type { DrizzleDatabase, IDatabaseProvider, IHealthCheckable } from '@shared/infrastructure/database/types.ts';
import { env } from '@shared/config/env.ts';

let dbInstance: DrizzleDatabase | null = null;
let sqlClient: SQL | null = null;

/**
 * Initialize and get database connection
 * Uses Bun's native SQL driver for PostgreSQL
 */
export function getDatabase(): DrizzleDatabase {
  if (!dbInstance) {
    try {
      // Create PostgreSQL connection using Bun's native SQL driver
      sqlClient = new SQL(env.DATABASE_URL);

      // Create Drizzle ORM instance
      dbInstance = drizzle(sqlClient);

      if (env.NODE_ENV !== 'test') {
        console.log(`Database connected: PostgreSQL`);
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  return dbInstance;
}

/**
 * Check if database is healthy
 */
export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    if (!sqlClient) {
      return false;
    }
    // Simple query to check if database is responsive
    await sqlClient.unsafe('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (sqlClient) {
    try {
      await sqlClient.close();
    } catch {
      // Ignore close errors
    }
    sqlClient = null;
    dbInstance = null;
    if (env.NODE_ENV !== 'test') {
      console.log('Database connection closed');
    }
  }
}

/**
 * Database provider implementation
 * Used for dependency injection
 */
export class DatabaseProvider implements IDatabaseProvider, IHealthCheckable {
  getDb(): DrizzleDatabase {
    return getDatabase();
  }

  async isHealthy(): Promise<boolean> {
    return isDatabaseHealthy();
  }
}
