import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  createRateLimiter,
  RateLimitPresets,
  destroyRateLimitStore,
  InMemoryRateLimitStore,
  type IRateLimitStore,
  type RateLimitEntry,
} from '@shared/infrastructure/middleware/RateLimiter.ts';

// Mock Elysia Context
function createMockContext(options: { ip?: string; path?: string; headers?: Record<string, string> } = {}) {
  const { ip = '127.0.0.1', path = '/test', headers = {} } = options;
  
  return {
    request: {
      url: `http://localhost:8702${path}`,
      headers: {
        get: (name: string) => {
          const key = name.toLowerCase();
          if (key === 'x-forwarded-for') return headers['x-forwarded-for'] ?? ip;
          if (key === 'x-real-ip') return headers['x-real-ip'];
          return headers[key];
        },
      },
    },
    set: {
      status: 200,
      headers: {} as Record<string, string>,
    },
  };
}

describe('RateLimiter Middleware', () => {
  beforeEach(() => {
    // Reset rate limit store before each test
    destroyRateLimitStore();
  });

  afterEach(() => {
    destroyRateLimitStore();
  });

  describe('createRateLimiter', () => {
    test('should allow requests under the limit', async () => {
      const limiter = createRateLimiter({
        maxRequests: 5,
        windowMs: 60000,
      });

      const ctx = createMockContext();
      const result = await limiter(ctx as any);

      expect(result).toBeUndefined();
      expect(ctx.set.headers['X-RateLimit-Limit']).toBe('5');
      expect(ctx.set.headers['X-RateLimit-Remaining']).toBe('4');
    });

    test('should decrement remaining count with each request', async () => {
      const limiter = createRateLimiter({
        maxRequests: 5,
        windowMs: 60000,
      });

      const ctx1 = createMockContext({ ip: '192.168.1.1' });
      await limiter(ctx1 as any);
      expect(ctx1.set.headers['X-RateLimit-Remaining']).toBe('4');

      const ctx2 = createMockContext({ ip: '192.168.1.1' });
      await limiter(ctx2 as any);
      expect(ctx2.set.headers['X-RateLimit-Remaining']).toBe('3');

      const ctx3 = createMockContext({ ip: '192.168.1.1' });
      await limiter(ctx3 as any);
      expect(ctx3.set.headers['X-RateLimit-Remaining']).toBe('2');
    });

    test('should block requests over the limit', async () => {
      const limiter = createRateLimiter({
        maxRequests: 2,
        windowMs: 60000,
        message: 'Rate limit exceeded',
      });

      const ip = '10.0.0.1';

      // First two requests should pass
      await limiter(createMockContext({ ip }) as any);
      await limiter(createMockContext({ ip }) as any);

      // Third request should be blocked
      const ctx = createMockContext({ ip });
      const result = await limiter(ctx as any);

      expect(result).toEqual({
        statusCode: 429,
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: expect.any(Number),
      });
      expect(ctx.set.status).toBe(429);
      expect(ctx.set.headers['Retry-After']).toBeDefined();
    });

    test('should track different IPs separately', async () => {
      const limiter = createRateLimiter({
        maxRequests: 2,
        windowMs: 60000,
      });

      // IP 1: 2 requests
      await limiter(createMockContext({ ip: '1.1.1.1' }) as any);
      await limiter(createMockContext({ ip: '1.1.1.1' }) as any);

      // IP 1: Should be blocked
      const ctx1 = createMockContext({ ip: '1.1.1.1' });
      const result1 = await limiter(ctx1 as any);
      expect(result1?.statusCode).toBe(429);

      // IP 2: Should still be allowed
      const ctx2 = createMockContext({ ip: '2.2.2.2' });
      const result2 = await limiter(ctx2 as any);
      expect(result2).toBeUndefined();
    });

    test('should use x-forwarded-for header when available', async () => {
      const limiter = createRateLimiter({
        maxRequests: 1,
        windowMs: 60000,
      });

      const ctx1 = createMockContext({ 
        headers: { 'x-forwarded-for': '203.0.113.1' } 
      });
      await limiter(ctx1 as any);

      const ctx2 = createMockContext({ 
        headers: { 'x-forwarded-for': '203.0.113.1' } 
      });
      const result = await limiter(ctx2 as any);

      expect(result?.statusCode).toBe(429);
    });

    test('should skip rate limiting when skip function returns true', async () => {
      const limiter = createRateLimiter({
        maxRequests: 1,
        windowMs: 60000,
        skip: (ctx) => new URL(ctx.request.url).pathname === '/health',
      });

      // Health endpoint should be skipped
      const healthCtx = createMockContext({ path: '/health' });
      await limiter(healthCtx as any);
      await limiter(healthCtx as any);
      const healthResult = await limiter(healthCtx as any);
      expect(healthResult).toBeUndefined();

      // Other endpoints should be limited
      const apiCtx = createMockContext({ path: '/api/test', ip: '10.10.10.10' });
      await limiter(apiCtx as any);
      const apiResult = await limiter(createMockContext({ path: '/api/test', ip: '10.10.10.10' }) as any);
      expect(apiResult?.statusCode).toBe(429);
    });

    test('should use custom key extractor', async () => {
      const limiter = createRateLimiter({
        maxRequests: 1,
        windowMs: 60000,
        keyExtractor: (ctx) => ctx.request.headers.get('x-api-key') ?? 'unknown',
      });

      const ctx1 = createMockContext({ headers: { 'x-api-key': 'key-123' } });
      await limiter(ctx1 as any);

      const ctx2 = createMockContext({ headers: { 'x-api-key': 'key-123' } });
      const result = await limiter(ctx2 as any);

      expect(result?.statusCode).toBe(429);
    });
  });

  describe('RateLimitPresets', () => {
    test('strict preset should have 5 requests per minute', () => {
      expect(RateLimitPresets.strict.maxRequests).toBe(5);
      expect(RateLimitPresets.strict.windowMs).toBe(60000);
    });

    test('standard preset should have 10 requests per minute', () => {
      expect(RateLimitPresets.standard.maxRequests).toBe(10);
      expect(RateLimitPresets.standard.windowMs).toBe(60000);
    });

    test('relaxed preset should have 100 requests per minute', () => {
      expect(RateLimitPresets.relaxed.maxRequests).toBe(100);
      expect(RateLimitPresets.relaxed.windowMs).toBe(60000);
    });

    test('public preset should have 1000 requests per minute', () => {
      expect(RateLimitPresets.public.maxRequests).toBe(1000);
      expect(RateLimitPresets.public.windowMs).toBe(60000);
    });
  });

  describe('destroyRateLimitStore', () => {
    test('should clear rate limit entries', async () => {
      const limiter = createRateLimiter({
        maxRequests: 1,
        windowMs: 60000,
      });

      const ip = '5.5.5.5';
      await limiter(createMockContext({ ip }) as any);

      // Should be blocked
      const ctx1 = createMockContext({ ip });
      const result1 = await limiter(ctx1 as any);
      expect(result1?.statusCode).toBe(429);

      // Destroy store
      destroyRateLimitStore();

      // Should be allowed again (new store)
      const ctx2 = createMockContext({ ip });
      const result2 = await limiter(ctx2 as any);
      expect(result2).toBeUndefined();
    });
  });

  describe('Custom Store Injection (DIP)', () => {
    test('should accept a custom store implementation', async () => {
      // Create a mock store that tracks calls
      const calls: string[] = [];
      const mockStore: IRateLimitStore = {
        get: (key) => {
          calls.push(`get:${key}`);
          return undefined;
        },
        set: (key, entry) => {
          calls.push(`set:${key}`);
        },
        increment: (key, windowMs) => {
          calls.push(`increment:${key}`);
          return { count: 1, resetTime: Date.now() + windowMs };
        },
      };

      const limiter = createRateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        store: mockStore,
      });

      await limiter(createMockContext({ ip: '1.2.3.4' }) as any);

      // Should have called the mock store
      expect(calls).toContain('increment:1.2.3.4');
    });

    test('should use InMemoryRateLimitStore when no store provided', async () => {
      const limiter = createRateLimiter({
        maxRequests: 2,
        windowMs: 60000,
      });

      // Should work with default store
      const ctx = createMockContext({ ip: '7.7.7.7' });
      await limiter(ctx as any);
      expect(ctx.set.headers['X-RateLimit-Remaining']).toBe('1');
    });

    test('InMemoryRateLimitStore should work standalone', () => {
      const store = new InMemoryRateLimitStore(0); // No cleanup interval for tests

      // First increment
      const entry1 = store.increment('test-key', 60000);
      expect(entry1.count).toBe(1);

      // Second increment
      const entry2 = store.increment('test-key', 60000);
      expect(entry2.count).toBe(2);

      // Get entry
      const entry3 = store.get('test-key');
      expect(entry3?.count).toBe(2);

      // Cleanup
      store.destroy();
    });

    test('InMemoryRateLimitStore should reset after window expires', async () => {
      const store = new InMemoryRateLimitStore(0);

      // Increment with very short window
      const entry1 = store.increment('expire-test', 1); // 1ms window
      expect(entry1.count).toBe(1);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 5));

      // Should create new entry
      const entry2 = store.increment('expire-test', 60000);
      expect(entry2.count).toBe(1); // Reset to 1

      store.destroy();
    });

    test('should isolate rate limits when using separate stores', async () => {
      const store1 = new InMemoryRateLimitStore(0);
      const store2 = new InMemoryRateLimitStore(0);

      const limiter1 = createRateLimiter({
        maxRequests: 1,
        windowMs: 60000,
        store: store1,
      });

      const limiter2 = createRateLimiter({
        maxRequests: 1,
        windowMs: 60000,
        store: store2,
      });

      const ip = '9.9.9.9';

      // Use up limit on limiter1
      await limiter1(createMockContext({ ip }) as any);
      const result1 = await limiter1(createMockContext({ ip }) as any);
      expect(result1?.statusCode).toBe(429);

      // limiter2 should still have full quota (different store)
      const result2 = await limiter2(createMockContext({ ip }) as any);
      expect(result2).toBeUndefined();

      store1.destroy();
      store2.destroy();
    });
  });
});
