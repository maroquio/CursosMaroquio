/**
 * API Versioning System
 * Provides URL-based API versioning with prefix support
 *
 * Features:
 * - Configurable version prefix (/v1, /v2, etc.)
 * - Version metadata in responses
 * - Deprecation headers for old versions
 * - Route grouping by version
 */

import { Elysia } from 'elysia';

/**
 * API version configuration
 */
export interface ApiVersionConfig {
  version: number;
  prefix: string;
  deprecated?: boolean;
  deprecationMessage?: string;
  sunset?: string; // ISO date when version will be removed
}

/**
 * Current API versions
 */
export const API_VERSIONS = {
  V1: {
    version: 1,
    prefix: '/v1',
    deprecated: false,
  },
} as const satisfies Record<string, ApiVersionConfig>;

/**
 * Default/current API version
 */
export const CURRENT_API_VERSION = API_VERSIONS.V1;

/**
 * Create versioned route prefix
 */
export function versionedPath(version: ApiVersionConfig, path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${version.prefix}${normalizedPath}`;
}

/**
 * Create deprecation headers for deprecated API versions
 */
export function createDeprecationHeaders(version: ApiVersionConfig): Record<string, string> {
  if (!version.deprecated) {
    return {};
  }

  const headers: Record<string, string> = {
    Deprecation: 'true',
  };

  if (version.deprecationMessage) {
    headers['X-Deprecation-Message'] = version.deprecationMessage;
  }

  if (version.sunset) {
    headers['Sunset'] = version.sunset;
  }

  return headers;
}

/**
 * Add version header to response
 */
export function createVersionMiddleware(version: ApiVersionConfig) {
  const deprecationHeaders = createDeprecationHeaders(version);

  return (ctx: { set: { headers: Record<string, string | number> } }) => {
    // Add version header
    ctx.set.headers['X-API-Version'] = String(version.version);

    // Add deprecation headers if applicable
    Object.entries(deprecationHeaders).forEach(([key, value]) => {
      ctx.set.headers[key] = value;
    });

    return undefined;
  };
}

/**
 * Create a versioned Elysia group
 * This creates a sub-application with version prefix
 *
 * @example
 * ```typescript
 * const v1 = createVersionedGroup(API_VERSIONS.V1);
 * v1.get('/users', () => 'list users'); // Available at /v1/users
 *
 * app.use(v1);
 * ```
 */
export function createVersionedGroup(version: ApiVersionConfig) {
  return new Elysia({ prefix: version.prefix })
    .onBeforeHandle(createVersionMiddleware(version));
}

/**
 * Type for controller route registration
 * Controllers should implement this to register versioned routes
 */
export type VersionedRouteRegistrar = (app: Elysia, version: ApiVersionConfig) => Elysia;

/**
 * Helper to create paths for a specific version
 * Useful in controllers to define paths consistently
 */
export function createPathBuilder(basePath: string) {
  return {
    /**
     * Get full path with version prefix
     */
    path: (subPath?: string): string => {
      if (!subPath) return basePath;
      const normalized = subPath.startsWith('/') ? subPath : `/${subPath}`;
      return `${basePath}${normalized}`;
    },

    /**
     * Get base path
     */
    base: basePath,
  };
}

/**
 * Response schema with API version
 */
export interface VersionedResponse<T> {
  success: boolean;
  statusCode: number;
  apiVersion: number;
  data?: T;
  error?: string;
}

/**
 * Create versioned response
 */
export function createVersionedResponse<T>(
  version: ApiVersionConfig,
  data: T,
  statusCode: number = 200
): VersionedResponse<T> {
  return {
    success: true,
    statusCode,
    apiVersion: version.version,
    data,
  };
}
