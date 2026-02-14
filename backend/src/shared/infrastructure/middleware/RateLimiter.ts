/**
 * Rate Limiter Middleware
 * Protects endpoints against DDoS and brute force attacks
 *
 * Uses in-memory store by default, but supports custom stores
 * for production clustering (Redis, Memcached, etc.)
 */

import type { Context } from 'elysia';

/**
 * Rate limit entry structure
 */
export interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Rate Limit Store Interface
 *
 * Abstraction for rate limit storage, following DIP.
 * Implement this interface for custom storage backends
 * (Redis, Memcached, database, etc.)
 *
 * @example
 * // Redis implementation
 * class RedisRateLimitStore implements IRateLimitStore {
 *   constructor(private redis: RedisClient) {}
 *   async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
 *     // Redis INCR with EXPIRE
 *   }
 * }
 */
export interface IRateLimitStore {
  /** Get entry for key */
  get(key: string): RateLimitEntry | undefined;

  /** Set entry for key */
  set(key: string, entry: RateLimitEntry): void;

  /** Increment counter and return updated entry */
  increment(key: string, windowMs: number): RateLimitEntry;

  /** Cleanup resources (optional) */
  destroy?(): void;
}

/**
 * Rate Limit Configuration
 */
export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Custom key extractor (defaults to IP) */
  keyExtractor?: (ctx: Context) => string;
  /** Skip rate limiting for certain requests */
  skip?: (ctx: Context) => boolean;
  /** Custom message when rate limited */
  message?: string;
  /** Custom store implementation (defaults to in-memory) */
  store?: IRateLimitStore;
}

/**
 * In-Memory Rate Limit Store
 *
 * Default implementation using Map for single-server deployments.
 * For multi-server deployments, inject a Redis-based store.
 */
export class InMemoryRateLimitStore implements IRateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(cleanupIntervalMs: number = 60000) {
    // Cleanup expired entries periodically
    if (cleanupIntervalMs > 0) {
      this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
    }
  }

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  increment(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || now > existing.resetTime) {
      const entry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs,
      };
      this.store.set(key, entry);
      return entry;
    }

    existing.count++;
    return existing;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Default global store instance (for backwards compatibility)
let defaultStore: InMemoryRateLimitStore | null = null;

function getDefaultStore(): InMemoryRateLimitStore {
  if (!defaultStore) {
    defaultStore = new InMemoryRateLimitStore();
  }
  return defaultStore;
}

/**
 * Default IP extractor
 */
function getClientIP(ctx: Context): string {
  // Check common proxy headers
  const forwarded = ctx.request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }

  const realIP = ctx.request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to server connection info
  // Note: In Bun/Elysia, we may need to access this differently
  return 'unknown';
}

/**
 * Create rate limiter middleware
 *
 * @param config - Rate limit configuration
 * @param config.store - Optional custom store (defaults to in-memory)
 *
 * @example
 * // With default in-memory store
 * const limiter = createRateLimiter({ maxRequests: 100, windowMs: 60000 });
 *
 * // With custom Redis store
 * const redisStore = new RedisRateLimitStore(redisClient);
 * const limiter = createRateLimiter({
 *   maxRequests: 100,
 *   windowMs: 60000,
 *   store: redisStore
 * });
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    maxRequests,
    windowMs,
    keyExtractor = getClientIP,
    skip,
    message = 'Too many requests, please try again later',
    store = getDefaultStore(),
  } = config;

  return async (ctx: Context) => {
    // Check if should skip
    if (skip && skip(ctx)) {
      return;
    }

    const key = keyExtractor(ctx);
    const entry = store.increment(key, windowMs);

    // Set rate limit headers
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetSeconds = Math.ceil((entry.resetTime - Date.now()) / 1000);

    ctx.set.headers['X-RateLimit-Limit'] = String(maxRequests);
    ctx.set.headers['X-RateLimit-Remaining'] = String(remaining);
    ctx.set.headers['X-RateLimit-Reset'] = String(resetSeconds);

    // Check if rate limited
    if (entry.count > maxRequests) {
      ctx.set.headers['Retry-After'] = String(resetSeconds);
      ctx.set.status = 429;

      return {
        statusCode: 429,
        success: false,
        error: message,
        retryAfter: resetSeconds,
      };
    }
  };
}

/**
 * Preset configurations for common use cases
 */
export const RateLimitPresets = {
  /** Strict: 5 requests per minute (for auth endpoints) */
  strict: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  },

  /** Standard: 10 requests per minute (for login) */
  standard: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },

  /** Relaxed: 100 requests per minute (for general API) */
  relaxed: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },

  /** Very relaxed: 1000 requests per minute (for public endpoints) */
  public: {
    maxRequests: 1000,
    windowMs: 60 * 1000,
  },
} as const;

/**
 * Combined rate limiter that applies different limits per route pattern
 */
export function createPathBasedRateLimiter(
  rules: Array<{
    pattern: RegExp | string;
    config: RateLimitConfig;
  }>
) {
  const limiters = rules.map((rule) => ({
    pattern: typeof rule.pattern === 'string' ? new RegExp(rule.pattern) : rule.pattern,
    limiter: createRateLimiter(rule.config),
  }));

  return async (ctx: Context) => {
    const path = new URL(ctx.request.url).pathname;

    for (const { pattern, limiter } of limiters) {
      if (pattern.test(path)) {
        return limiter(ctx);
      }
    }

    // Default: no rate limiting if no pattern matches
    return;
  };
}

/**
 * Cleanup function for graceful shutdown
 * Destroys the default global store instance
 */
export function destroyRateLimitStore(): void {
  if (defaultStore) {
    defaultStore.destroy();
    defaultStore = null;
  }
}
