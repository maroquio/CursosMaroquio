import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { SecurityPresets } from '@shared/infrastructure/middleware/SecurityHeaders.ts';

// Mock Elysia Context
function createMockContext() {
  return {
    request: {
      url: 'http://localhost:3000/test',
    },
    set: {
      headers: {} as Record<string, string>,
    },
  };
}

describe('SecurityHeaders Middleware', () => {
  describe('createSecurityHeaders - Common Headers (ENV-independent)', () => {
    test('should set basic security headers', async () => {
      // Import dynamically to get fresh module
      const { createSecurityHeaders } = await import('@shared/infrastructure/middleware/SecurityHeaders.ts');
      const middleware = createSecurityHeaders();
      const ctx = createMockContext();

      middleware(ctx as any);

      expect(ctx.set.headers['X-Content-Type-Options']).toBe('nosniff');
      expect(ctx.set.headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(ctx.set.headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    });

    test('should set X-Frame-Options to DENY by default', async () => {
      const { createSecurityHeaders } = await import('@shared/infrastructure/middleware/SecurityHeaders.ts');
      const middleware = createSecurityHeaders();
      const ctx = createMockContext();

      middleware(ctx as any);

      expect(ctx.set.headers['X-Frame-Options']).toBe('DENY');
    });

    test('should set Permissions-Policy header', async () => {
      const { createSecurityHeaders } = await import('@shared/infrastructure/middleware/SecurityHeaders.ts');
      const middleware = createSecurityHeaders();
      const ctx = createMockContext();

      middleware(ctx as any);

      expect(ctx.set.headers['Permissions-Policy']).toBe(
        'camera=(), microphone=(), geolocation=(), payment=()'
      );
    });

    test('should set X-Permitted-Cross-Domain-Policies header', async () => {
      const { createSecurityHeaders } = await import('@shared/infrastructure/middleware/SecurityHeaders.ts');
      const middleware = createSecurityHeaders();
      const ctx = createMockContext();

      middleware(ctx as any);

      expect(ctx.set.headers['X-Permitted-Cross-Domain-Policies']).toBe('none');
    });

    test('should set cache control headers', async () => {
      const { createSecurityHeaders } = await import('@shared/infrastructure/middleware/SecurityHeaders.ts');
      const middleware = createSecurityHeaders();
      const ctx = createMockContext();

      middleware(ctx as any);

      expect(ctx.set.headers['Cache-Control']).toBe(
        'no-store, no-cache, must-revalidate, proxy-revalidate'
      );
      expect(ctx.set.headers['Pragma']).toBe('no-cache');
      expect(ctx.set.headers['Expires']).toBe('0');
    });

    test('should not override existing Cache-Control header', async () => {
      const { createSecurityHeaders } = await import('@shared/infrastructure/middleware/SecurityHeaders.ts');
      const middleware = createSecurityHeaders();
      const ctx = createMockContext();
      ctx.set.headers['Cache-Control'] = 'max-age=3600';

      middleware(ctx as any);

      expect(ctx.set.headers['Cache-Control']).toBe('max-age=3600');
    });
  });

  describe('createSecurityHeaders - Configuration', () => {
    test('should allow disabling X-Frame-Options', async () => {
      const { createSecurityHeaders } = await import('@shared/infrastructure/middleware/SecurityHeaders.ts');
      const middleware = createSecurityHeaders({
        enableFrameOptions: false,
      });
      const ctx = createMockContext();

      middleware(ctx as any);

      expect(ctx.set.headers['X-Frame-Options']).toBeUndefined();
    });

    test('should allow SAMEORIGIN for X-Frame-Options', async () => {
      const { createSecurityHeaders } = await import('@shared/infrastructure/middleware/SecurityHeaders.ts');
      const middleware = createSecurityHeaders({
        frameOptions: 'SAMEORIGIN',
      });
      const ctx = createMockContext();

      middleware(ctx as any);

      expect(ctx.set.headers['X-Frame-Options']).toBe('SAMEORIGIN');
    });
  });

  describe('SecurityPresets', () => {
    test('strict preset should have maximum security settings', () => {
      expect(SecurityPresets.strict).toEqual({
        enableHSTS: true,
        enableCSP: true,
        enableFrameOptions: true,
        frameOptions: 'DENY',
      });
    });

    test('relaxed preset should have minimal security settings', () => {
      expect(SecurityPresets.relaxed).toEqual({
        enableHSTS: false,
        enableCSP: false,
        enableFrameOptions: true,
        frameOptions: 'SAMEORIGIN',
      });
    });

    test('api preset should be optimized for API servers', () => {
      expect(SecurityPresets.api).toEqual({
        enableHSTS: true,
        enableCSP: true,
        cspDirectives: {
          'default-src': "'none'",
          'frame-ancestors': "'none'",
        },
        enableFrameOptions: true,
        frameOptions: 'DENY',
      });
    });
  });

  describe('Environment-dependent behavior', () => {
    // Note: These tests verify behavior based on the current NODE_ENV
    // In development, CSP and HSTS should NOT be set
    // The actual production behavior would need integration tests

    test('should respect enableCSP=false configuration', async () => {
      const { createSecurityHeaders } = await import('@shared/infrastructure/middleware/SecurityHeaders.ts');
      const middleware = createSecurityHeaders({
        enableCSP: false,
      });
      const ctx = createMockContext();

      middleware(ctx as any);

      // CSP should not be set when disabled via config
      expect(ctx.set.headers['Content-Security-Policy']).toBeUndefined();
    });

    test('should respect enableHSTS=false configuration', async () => {
      const { createSecurityHeaders } = await import('@shared/infrastructure/middleware/SecurityHeaders.ts');
      const middleware = createSecurityHeaders({
        enableHSTS: false,
      });
      const ctx = createMockContext();

      middleware(ctx as any);

      // HSTS should not be set when disabled via config
      expect(ctx.set.headers['Strict-Transport-Security']).toBeUndefined();
    });
  });
});
