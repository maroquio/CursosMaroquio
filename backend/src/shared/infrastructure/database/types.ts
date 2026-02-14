import type { BunSQLDatabase } from 'drizzle-orm/bun-sql';

/**
 * Database type definitions
 * Provides type safety for database connections
 */

/**
 * Type alias for the Drizzle database instance
 * This is the typed version of the PostgreSQL database connection using Bun's native SQL driver
 */
export type DrizzleDatabase = BunSQLDatabase;

/**
 * Interface for database provider
 * Used for dependency injection of database connections
 */
export interface IDatabaseProvider {
  getDb(): DrizzleDatabase;
}

/**
 * Interface for health check capable database
 */
export interface IHealthCheckable {
  isHealthy(): Promise<boolean>;
}
