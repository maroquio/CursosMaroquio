import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  InMemoryRateLimitStore,
  createRateLimiter,
  createPathBasedRateLimiter,
  destroyRateLimitStore,
  RateLimitPresets,
  type RateLimitEntry,
} from '@shared/infrastructure/middleware/RateLimiter.ts';

/**
 * Create mock Elysia context
 */
function createMockContext(headers: Record<string, string> = {}, url: string = 'http://localhost/'): any {
  return {
    request: {
      url,
      headers: {
        get: (name: string) => headers[name.toLowerCase()] ?? null,
      },
    },
    set: {
      headers: {} as Record<string, string>,
      status: 200,
    },
  };
}

describe('RateLimiter', () => {
  describe('InMemoryRateLimitStore', () => {
    let store: InMemoryRateLimitStore;

    beforeEach(() => {
      store = new InMemoryRateLimitStore(0); // Disable cleanup for tests
    });

    afterEach(() => {
      store.destroy();
    });

    describe('get and set', () => {
      it('should return undefined for non-existent key', () => {
        const result = store.get('non-existent');
        expect(result).toBeUndefined();
      });

      it('should store and retrieve entry', () => {
        const entry: RateLimitEntry = { count: 5, resetTime: Date.now() + 60000 };
        store.set('test-key', entry);

        const result = store.get('test-key');
        expect(result).toEqual(entry);
      });

      it('should overwrite existing entry', () => {
        store.set('test-key', { count: 1, resetTime: Date.now() + 60000 });
        store.set('test-key', { count: 10, resetTime: Date.now() + 120000 });

        const result = store.get('test-key');
        expect(result!.count).toBe(10);
      });
    });

    describe('increment', () => {
      it('should create new entry for first request', () => {
        const entry = store.increment('new-key', 60000);

        expect(entry.count).toBe(1);
        expect(entry.resetTime).toBeGreaterThan(Date.now());
      });

      it('should increment existing entry', () => {
        store.increment('test-key', 60000);
        store.increment('test-key', 60000);
        const entry = store.increment('test-key', 60000);

        expect(entry.count).toBe(3);
      });

      it('should reset entry after window expires', async () => {
        const shortWindow = 50; // 50ms
        store.increment('test-key', shortWindow);

        await new Promise((resolve) => setTimeout(resolve, 60));

        const entry = store.increment('test-key', shortWindow);
        expect(entry.count).toBe(1);
      });
    });

    describe('destroy', () => {
      it('should clear store on destroy', () => {
        store.set('key1', { count: 1, resetTime: Date.now() + 60000 });
        store.set('key2', { count: 2, resetTime: Date.now() + 60000 });

        store.destroy();

        expect(store.get('key1')).toBeUndefined();
        expect(store.get('key2')).toBeUndefined();
      });
    });

    describe('cleanup', () => {
      it('should cleanup expired entries', async () => {
        const shortWindow = 50;
        const storeWithCleanup = new InMemoryRateLimitStore(100);

        storeWithCleanup.increment('key1', shortWindow);

        await new Promise((resolve) => setTimeout(resolve, 150));

        expect(storeWithCleanup.get('key1')).toBeUndefined();
        storeWithCleanup.destroy();
      });
    });
  });

  describe('createRateLimiter', () => {
    beforeEach(() => {
      destroyRateLimitStore();
    });

    afterEach(() => {
      destroyRateLimitStore();
    });

    it('should allow requests under limit', async () => {
      const limiter = createRateLimiter({
        maxRequests: 5,
        windowMs: 60000,
      });
      const ctx = createMockContext({ 'x-forwarded-for': '192.168.1.1' });

      const result = await limiter(ctx);

      expect(result).toBeUndefined();
      expect(ctx.set.headers['X-RateLimit-Limit']).toBe('5');
      expect(ctx.set.headers['X-RateLimit-Remaining']).toBe('4');
    });

    it('should block requests over limit', async () => {
      const store = new InMemoryRateLimitStore(0);
      const limiter = createRateLimiter({
        maxRequests: 2,
        windowMs: 60000,
        store,
      });

      const ctx = createMockContext({ 'x-forwarded-for': '192.168.1.1' });

      // Make 3 requests
      await limiter(ctx);
      await limiter(ctx);
      const result = await limiter(ctx);

      expect(result).toBeDefined();
      expect((result as any).statusCode).toBe(429);
      expect(ctx.set.status).toBe(429);

      store.destroy();
    });

    it('should use custom key extractor', async () => {
      const store = new InMemoryRateLimitStore(0);
      const limiter = createRateLimiter({
        maxRequests: 2,
        windowMs: 60000,
        keyExtractor: () => 'custom-key',
        store,
      });

      const ctx1 = createMockContext({ 'x-forwarded-for': '192.168.1.1' });
      const ctx2 = createMockContext({ 'x-forwarded-for': '192.168.1.2' });

      await limiter(ctx1);
      await limiter(ctx2);
      const result = await limiter(ctx1);

      // Should be rate limited because both use same key
      expect(result).toBeDefined();
      expect((result as any).statusCode).toBe(429);

      store.destroy();
    });

    it('should skip rate limiting when skip returns true', async () => {
      const store = new InMemoryRateLimitStore(0);
      const limiter = createRateLimiter({
        maxRequests: 1,
        windowMs: 60000,
        skip: () => true,
        store,
      });

      const ctx = createMockContext();

      await limiter(ctx);
      const result = await limiter(ctx);

      // Should not be rate limited
      expect(result).toBeUndefined();

      store.destroy();
    });

    it('should use custom message', async () => {
      const store = new InMemoryRateLimitStore(0);
      const limiter = createRateLimiter({
        maxRequests: 1,
        windowMs: 60000,
        message: 'Custom rate limit message',
        store,
      });

      const ctx = createMockContext({ 'x-forwarded-for': '192.168.1.1' });

      await limiter(ctx);
      const result = await limiter(ctx);

      expect((result as any).error).toBe('Custom rate limit message');

      store.destroy();
    });

    it('should set Retry-After header when rate limited', async () => {
      const store = new InMemoryRateLimitStore(0);
      const limiter = createRateLimiter({
        maxRequests: 1,
        windowMs: 60000,
        store,
      });

      const ctx = createMockContext({ 'x-forwarded-for': '192.168.1.1' });

      await limiter(ctx);
      await limiter(ctx);

      expect(ctx.set.headers['Retry-After']).toBeDefined();

      store.destroy();
    });

    it('should extract IP from x-real-ip when x-forwarded-for not present', async () => {
      const store = new InMemoryRateLimitStore(0);
      const limiter = createRateLimiter({
        maxRequests: 5,
        windowMs: 60000,
        store,
      });

      const ctx = createMockContext({ 'x-real-ip': '10.0.0.1' });
      await limiter(ctx);

      expect(store.get('10.0.0.1')).toBeDefined();

      store.destroy();
    });

    it('should use "unknown" when no IP headers present', async () => {
      const store = new InMemoryRateLimitStore(0);
      const limiter = createRateLimiter({
        maxRequests: 5,
        windowMs: 60000,
        store,
      });

      const ctx = createMockContext({});
      await limiter(ctx);

      expect(store.get('unknown')).toBeDefined();

      store.destroy();
    });
  });

  describe('createPathBasedRateLimiter', () => {
    beforeEach(() => {
      destroyRateLimitStore();
    });

    afterEach(() => {
      destroyRateLimitStore();
    });

    it('should apply different limits for different paths', async () => {
      const store1 = new InMemoryRateLimitStore(0);
      const store2 = new InMemoryRateLimitStore(0);

      const limiter = createPathBasedRateLimiter([
        {
          pattern: /^\/api\/auth/,
          config: { maxRequests: 2, windowMs: 60000, store: store1 },
        },
        {
          pattern: /^\/api/,
          config: { maxRequests: 10, windowMs: 60000, store: store2 },
        },
      ]);

      const authCtx = createMockContext(
        { 'x-forwarded-for': '192.168.1.1' },
        'http://localhost/api/auth/login'
      );
      const apiCtx = createMockContext(
        { 'x-forwarded-for': '192.168.1.1' },
        'http://localhost/api/users'
      );

      // Auth endpoint should use strict limit
      await limiter(authCtx);
      await limiter(authCtx);
      const authResult = await limiter(authCtx);

      expect(authResult).toBeDefined();
      expect((authResult as any).statusCode).toBe(429);

      // API endpoint should allow more requests
      const apiResult = await limiter(apiCtx);
      expect(apiResult).toBeUndefined();

      store1.destroy();
      store2.destroy();
    });

    it('should support string patterns', async () => {
      const store = new InMemoryRateLimitStore(0);
      const limiter = createPathBasedRateLimiter([
        {
          pattern: '^/health',
          config: { maxRequests: 100, windowMs: 60000, store },
        },
      ]);

      const ctx = createMockContext(
        { 'x-forwarded-for': '192.168.1.1' },
        'http://localhost/health'
      );

      const result = await limiter(ctx);
      expect(result).toBeUndefined();

      store.destroy();
    });

    it('should return undefined when no pattern matches', async () => {
      const limiter = createPathBasedRateLimiter([
        {
          pattern: /^\/specific/,
          config: { maxRequests: 1, windowMs: 60000 },
        },
      ]);

      const ctx = createMockContext(
        { 'x-forwarded-for': '192.168.1.1' },
        'http://localhost/other/path'
      );

      const result = await limiter(ctx);
      expect(result).toBeUndefined();
    });
  });

  describe('RateLimitPresets', () => {
    it('should have strict preset', () => {
      expect(RateLimitPresets.strict.maxRequests).toBe(5);
      expect(RateLimitPresets.strict.windowMs).toBe(60000);
    });

    it('should have standard preset', () => {
      expect(RateLimitPresets.standard.maxRequests).toBe(10);
      expect(RateLimitPresets.standard.windowMs).toBe(60000);
    });

    it('should have relaxed preset', () => {
      expect(RateLimitPresets.relaxed.maxRequests).toBe(100);
      expect(RateLimitPresets.relaxed.windowMs).toBe(60000);
    });

    it('should have public preset', () => {
      expect(RateLimitPresets.public.maxRequests).toBe(1000);
      expect(RateLimitPresets.public.windowMs).toBe(60000);
    });
  });

  describe('destroyRateLimitStore', () => {
    it('should handle being called multiple times', () => {
      destroyRateLimitStore();
      destroyRateLimitStore();
      // Should not throw
    });
  });
});
