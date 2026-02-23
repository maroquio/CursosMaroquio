/**
 * Environment configuration
 * Centralizes all environment variables with defaults
 * Uses process.env which works in both Bun and Node.js (for Vitest)
 * Bun automatically loads .env files
 */

interface EnvConfig {
  // Server
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';

  // Database (PostgreSQL)
  DATABASE_URL: string;

  // CORS
  CORS_ORIGIN: string;

  // Cookie
  COOKIE_DOMAIN: string;

  // Logging
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';

  // JWT Authentication
  JWT_SECRET: string;
  JWT_ACCESS_EXPIRY_MS: number;
  JWT_REFRESH_EXPIRY_MS: number;

  // OAuth - Google (optional, provider enabled only if configured)
  GOOGLE_CLIENT_ID: string | null;
  GOOGLE_CLIENT_SECRET: string | null;

  // OAuth - Facebook (optional, provider enabled only if configured)
  FACEBOOK_APP_ID: string | null;
  FACEBOOK_APP_SECRET: string | null;

  // OAuth - Apple (optional, provider enabled only if configured)
  APPLE_CLIENT_ID: string | null; // Service ID (e.g., com.yourapp.auth)
  APPLE_TEAM_ID: string | null; // Team ID from Apple Developer
  APPLE_KEY_ID: string | null; // Key ID for Sign in with Apple
  APPLE_PRIVATE_KEY: string | null; // Contents of .p8 file (base64 encoded)

  // OAuth - Common
  OAUTH_REDIRECT_BASE_URL: string; // Base URL for OAuth callbacks (e.g., http://localhost:8702)
}

function getEnvString(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function getEnvStringOptional(key: string): string | null {
  const value = process.env[key];
  return value && value.trim() !== '' ? value : null;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function getEnvEnum<T extends string>(
  key: string,
  allowedValues: T[],
  defaultValue: T
): T {
  const value = process.env[key] as T | undefined;
  if (value && allowedValues.includes(value)) {
    return value;
  }
  return defaultValue;
}

/**
 * Parse duration string to milliseconds
 * Supports: '15m', '1h', '7d', '30d'
 */
function parseDuration(value: string, defaultMs: number): number {
  const match = value.match(/^(\d+)(m|h|d)$/);
  if (!match || !match[1] || !match[2]) return defaultMs;

  const num = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'm':
      return num * 60 * 1000; // minutes
    case 'h':
      return num * 60 * 60 * 1000; // hours
    case 'd':
      return num * 24 * 60 * 60 * 1000; // days
    default:
      return defaultMs;
  }
}

/**
 * Generate a secure random secret for development only.
 *
 * SECURITY WARNING:
 * - This secret is generated at runtime and cached in memory
 * - It changes every time the application restarts
 * - Tokens signed with this secret become invalid after restart
 * - NEVER use auto-generated secrets in production
 * - In production, JWT_SECRET MUST be set via environment variable
 *   or a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
 *
 * @returns 64-character hex string (256-bit entropy)
 */
function generateDevSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Tracks whether we're using an auto-generated development secret
 * Used for logging warnings at startup
 */
const isUsingDevSecret = !process.env.JWT_SECRET;

// Cache dev secret so it's stable during development session
// Note: This secret is stored in memory and will be lost on restart
const DEV_SECRET = generateDevSecret();

/**
 * Application environment configuration
 * All values have sensible defaults for development
 */
export const env: EnvConfig = {
  PORT: getEnvNumber('PORT', 8702),
  NODE_ENV: getEnvEnum('NODE_ENV', ['development', 'production', 'test'], 'development'),
  DATABASE_URL: getEnvString('DATABASE_URL', 'postgresql://app:app@localhost:5435/app'),
  CORS_ORIGIN: getEnvString('CORS_ORIGIN', '*'),
  COOKIE_DOMAIN: getEnvString('COOKIE_DOMAIN', 'localhost'),
  LOG_LEVEL: getEnvEnum('LOG_LEVEL', ['debug', 'info', 'warn', 'error'], 'info'),

  // JWT - defaults: 15 minutes for access, 7 days for refresh
  JWT_SECRET: getEnvString('JWT_SECRET', DEV_SECRET),
  JWT_ACCESS_EXPIRY_MS: parseDuration(getEnvString('JWT_ACCESS_EXPIRY', '15m'), 15 * 60 * 1000),
  JWT_REFRESH_EXPIRY_MS: parseDuration(getEnvString('JWT_REFRESH_EXPIRY', '7d'), 7 * 24 * 60 * 60 * 1000),

  // OAuth - Google
  GOOGLE_CLIENT_ID: getEnvStringOptional('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: getEnvStringOptional('GOOGLE_CLIENT_SECRET'),

  // OAuth - Facebook
  FACEBOOK_APP_ID: getEnvStringOptional('FACEBOOK_APP_ID'),
  FACEBOOK_APP_SECRET: getEnvStringOptional('FACEBOOK_APP_SECRET'),

  // OAuth - Apple
  APPLE_CLIENT_ID: getEnvStringOptional('APPLE_CLIENT_ID'),
  APPLE_TEAM_ID: getEnvStringOptional('APPLE_TEAM_ID'),
  APPLE_KEY_ID: getEnvStringOptional('APPLE_KEY_ID'),
  APPLE_PRIVATE_KEY: getEnvStringOptional('APPLE_PRIVATE_KEY'),

  // OAuth - Common (defaults to localhost for development)
  OAUTH_REDIRECT_BASE_URL: getEnvString('OAUTH_REDIRECT_BASE_URL', 'http://localhost:8702'),
};

/**
 * Minimum recommended length for JWT_SECRET (32 bytes = 256 bits)
 */
const MIN_SECRET_LENGTH = 32;

/**
 * Validate that required environment variables are set
 * Call this at application startup
 */
export function validateEnv(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (env.PORT < 1 || env.PORT > 65535) {
    errors.push(`PORT must be between 1 and 65535, got: ${env.PORT}`);
  }

  // JWT_SECRET validations
  if (env.NODE_ENV === 'production') {
    // JWT_SECRET must be explicitly set in production
    if (!process.env.JWT_SECRET) {
      errors.push('JWT_SECRET must be set in production environment');
    } else if (process.env.JWT_SECRET.length < MIN_SECRET_LENGTH) {
      errors.push(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production`);
    }

    // CORS should be restricted in production
    if (env.CORS_ORIGIN === '*') {
      warnings.push('CORS_ORIGIN is set to "*" in production - consider restricting');
    }
  } else if (isUsingDevSecret) {
    // Development/test environment using auto-generated secret
    warnings.push(
      'Using auto-generated JWT_SECRET for development. ' +
        'Tokens will be invalidated on restart. ' +
        'Set JWT_SECRET environment variable for persistent tokens.'
    );
  }

  // Validate JWT_SECRET strength when explicitly provided
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < MIN_SECRET_LENGTH) {
    warnings.push(
      `JWT_SECRET is only ${process.env.JWT_SECRET.length} characters. ` +
        `Recommended minimum is ${MIN_SECRET_LENGTH} characters (256 bits).`
    );
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment warnings:\n' + warnings.map((w) => `   - ${w}`).join('\n') + '\n');
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Check if the application is using an auto-generated development secret.
 * Useful for conditional logic or additional security checks.
 */
export function isUsingAutoGeneratedSecret(): boolean {
  return isUsingDevSecret;
}

/**
 * OAuth provider availability checks
 * Providers are only available if all required credentials are configured
 */
export function isGoogleOAuthEnabled(): boolean {
  return env.GOOGLE_CLIENT_ID !== null && env.GOOGLE_CLIENT_SECRET !== null;
}

export function isFacebookOAuthEnabled(): boolean {
  return env.FACEBOOK_APP_ID !== null && env.FACEBOOK_APP_SECRET !== null;
}

export function isAppleOAuthEnabled(): boolean {
  return (
    env.APPLE_CLIENT_ID !== null &&
    env.APPLE_TEAM_ID !== null &&
    env.APPLE_KEY_ID !== null &&
    env.APPLE_PRIVATE_KEY !== null
  );
}

/**
 * Get list of enabled OAuth providers
 */
export function getEnabledOAuthProviders(): string[] {
  const providers: string[] = [];
  if (isGoogleOAuthEnabled()) providers.push('google');
  if (isFacebookOAuthEnabled()) providers.push('facebook');
  if (isAppleOAuthEnabled()) providers.push('apple');
  return providers;
}
