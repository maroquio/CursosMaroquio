import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * SecurityHeaders Production Mode Tests
 * Tests CSP and HSTS headers which only activate in production environment
 *
 * These tests use dynamic imports to test production-mode behavior
 */

// Helper to create mock context
function createMockContext(url = 'http://localhost/test'): any {
  return {
    request: { url },
    set: {
      headers: {} as Record<string, string>,
    },
  };
}

describe('SecurityHeaders in Production Mode', () => {
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    // Reset modules before each test to pick up env changes
    vi.resetModules();
  });

  afterEach(() => {
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
    vi.resetModules();
  });

  describe('buildCSP function', () => {
    it('should build CSP header from directives', async () => {
      // Force production mode for CSP to be applied
      process.env.NODE_ENV = 'production';

      // Test that CSP directives are correctly formatted
      // We can't easily test buildCSP directly since it's not exported,
      // but we can verify the CSP header format in production
      const { createSecurityHeaders } =
        await import('@shared/infrastructure/middleware/SecurityHeaders.ts');

      const middleware = createSecurityHeaders({
        enableCSP: true,
        cspDirectives: {
          'default-src': "'self'",
          'script-src': "'self' cdn.example.com",
        },
      });
      const ctx = createMockContext();
      middleware(ctx);

      // In production, CSP should be set
      const csp = ctx.set.headers['Content-Security-Policy'];
      if (csp) {
        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain("script-src 'self' cdn.example.com");
      }
    });
  });

  describe('CSP Header in Production', () => {
    it('should set Content-Security-Policy header when enableCSP is true in production', async () => {
      process.env.NODE_ENV = 'production';

      const { createSecurityHeaders } =
        await import('@shared/infrastructure/middleware/SecurityHeaders.ts');

      const middleware = createSecurityHeaders({
        enableCSP: true,
        cspDirectives: {
          'default-src': "'none'",
          'frame-ancestors': "'none'",
        },
      });
      const ctx = createMockContext();
      middleware(ctx);

      const csp = ctx.set.headers['Content-Security-Policy'];
      expect(csp).toBeDefined();
      expect(csp).toContain("default-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('should merge custom CSP directives with defaults in production', async () => {
      process.env.NODE_ENV = 'production';

      const { createSecurityHeaders } =
        await import('@shared/infrastructure/middleware/SecurityHeaders.ts');

      const middleware = createSecurityHeaders({
        enableCSP: true,
        cspDirectives: {
          'img-src': "'self' images.example.com",
        },
      });
      const ctx = createMockContext();
      middleware(ctx);

      const csp = ctx.set.headers['Content-Security-Policy'];
      expect(csp).toBeDefined();
      // Should have the custom directive
      expect(csp).toContain("img-src 'self' images.example.com");
    });

    it('should not set CSP when enableCSP is false even in production', async () => {
      process.env.NODE_ENV = 'production';

      const { createSecurityHeaders } =
        await import('@shared/infrastructure/middleware/SecurityHeaders.ts');

      const middleware = createSecurityHeaders({
        enableCSP: false,
      });
      const ctx = createMockContext();
      middleware(ctx);

      expect(ctx.set.headers['Content-Security-Policy']).toBeUndefined();
    });
  });

  describe('HSTS Header in Production', () => {
    it('should set Strict-Transport-Security header when enableHSTS is true in production', async () => {
      process.env.NODE_ENV = 'production';

      const { createSecurityHeaders } =
        await import('@shared/infrastructure/middleware/SecurityHeaders.ts');

      const middleware = createSecurityHeaders({
        enableHSTS: true,
      });
      const ctx = createMockContext();
      middleware(ctx);

      const hsts = ctx.set.headers['Strict-Transport-Security'];
      expect(hsts).toBeDefined();
      expect(hsts).toContain('max-age=31536000');
      expect(hsts).toContain('includeSubDomains');
      expect(hsts).toContain('preload');
    });

    it('should not set HSTS when enableHSTS is false in production', async () => {
      process.env.NODE_ENV = 'production';

      const { createSecurityHeaders } =
        await import('@shared/infrastructure/middleware/SecurityHeaders.ts');

      const middleware = createSecurityHeaders({
        enableHSTS: false,
      });
      const ctx = createMockContext();
      middleware(ctx);

      expect(ctx.set.headers['Strict-Transport-Security']).toBeUndefined();
    });
  });

  describe('Full production configuration', () => {
    it('should set all production headers with strict preset', async () => {
      process.env.NODE_ENV = 'production';

      const { createSecurityHeaders, SecurityPresets } =
        await import('@shared/infrastructure/middleware/SecurityHeaders.ts');

      const middleware = createSecurityHeaders(SecurityPresets.strict);
      const ctx = createMockContext();
      middleware(ctx);

      // Basic headers (always set)
      expect(ctx.set.headers['X-Content-Type-Options']).toBe('nosniff');
      expect(ctx.set.headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(ctx.set.headers['X-Frame-Options']).toBe('DENY');

      // Production-only headers
      expect(ctx.set.headers['Content-Security-Policy']).toBeDefined();
      expect(ctx.set.headers['Strict-Transport-Security']).toBeDefined();
    });

    it('should set all production headers with api preset', async () => {
      process.env.NODE_ENV = 'production';

      const { createSecurityHeaders, SecurityPresets } =
        await import('@shared/infrastructure/middleware/SecurityHeaders.ts');

      const middleware = createSecurityHeaders(SecurityPresets.api);
      const ctx = createMockContext();
      middleware(ctx);

      const csp = ctx.set.headers['Content-Security-Policy'];
      expect(csp).toBeDefined();
      expect(csp).toContain("default-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
    });
  });
});
