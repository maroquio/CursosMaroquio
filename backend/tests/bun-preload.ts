/**
 * Bun test preload file
 * Sets up environment variables and other configurations before tests run
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://cursos_maroquio:cursos_maroquio@localhost:5435/cursos_maroquio';
process.env.JWT_SECRET = 'test-secret-key-for-integration-tests-minimum-32-chars';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';
