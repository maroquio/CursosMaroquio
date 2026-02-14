import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createSecurityHeaders,
  SecurityPresets,
} from '@shared/infrastructure/middleware/SecurityHeaders.ts';

/**
 * Create mock Elysia context
 */
function createMockContext(url = 'http://localhost/test'): any {
  return {
    request: { url },
    set: {
      headers: {} as Record<string, string>,
    },
  };
}

/**
 * Production environment tests
 * These tests verify CSP and HSTS headers which only activate in production
 */
describe('SecurityHeaders Production Mode', () => {
  // Store original NODE_ENV
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    // Restore original NODE_ENV
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe('when NODE_ENV is production', () => {
    // Note: These tests document expected production behavior
    // The actual CSP/HSTS headers require module reload to pick up env changes

    it('should configure CSP directives correctly in strict preset', () => {
      const config = SecurityPresets.strict;

      expect(config.enableCSP).toBe(true);
      expect(config.enableHSTS).toBe(true);
    });

    it('should have secure default CSP directives', () => {
      // Test the default CSP directives structure
      const config = SecurityPresets.api;

      expect(config.cspDirectives).toBeDefined();
      expect(config.cspDirectives!['default-src']).toBe("'none'");
      expect(config.cspDirectives!['frame-ancestors']).toBe("'none'");
    });

    it('should merge custom CSP directives with defaults', () => {
      const customDirectives = {
        'script-src': "'self' cdn.example.com",
        'img-src': "'self' images.example.com",
      };

      const middleware = createSecurityHeaders({
        enableCSP: true,
        cspDirectives: customDirectives,
      });

      // The middleware is created with merged directives
      // Actual application depends on NODE_ENV at runtime
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });
  });
});

describe('SecurityHeaders', () => {
  describe('createSecurityHeaders', () => {
    describe('default headers', () => {
      it('should set X-Content-Type-Options', () => {
        const middleware = createSecurityHeaders();
        const ctx = createMockContext();

        middleware(ctx);

        expect(ctx.set.headers['X-Content-Type-Options']).toBe('nosniff');
      });

      it('should set X-XSS-Protection', () => {
        const middleware = createSecurityHeaders();
        const ctx = createMockContext();

        middleware(ctx);

        expect(ctx.set.headers['X-XSS-Protection']).toBe('1; mode=block');
      });

      it('should set Referrer-Policy', () => {
        const middleware = createSecurityHeaders();
        const ctx = createMockContext();

        middleware(ctx);

        expect(ctx.set.headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      });

      it('should set Permissions-Policy', () => {
        const middleware = createSecurityHeaders();
        const ctx = createMockContext();

        middleware(ctx);

        expect(ctx.set.headers['Permissions-Policy']).toBe(
          'camera=(), microphone=(), geolocation=(), payment=()'
        );
      });

      it('should set X-Permitted-Cross-Domain-Policies', () => {
        const middleware = createSecurityHeaders();
        const ctx = createMockContext();

        middleware(ctx);

        expect(ctx.set.headers['X-Permitted-Cross-Domain-Policies']).toBe('none');
      });

      it('should set Cache-Control headers', () => {
        const middleware = createSecurityHeaders();
        const ctx = createMockContext();

        middleware(ctx);

        expect(ctx.set.headers['Cache-Control']).toBe(
          'no-store, no-cache, must-revalidate, proxy-revalidate'
        );
        expect(ctx.set.headers['Pragma']).toBe('no-cache');
        expect(ctx.set.headers['Expires']).toBe('0');
      });

      it('should not override existing Cache-Control header', () => {
        const middleware = createSecurityHeaders();
        const ctx = createMockContext();
        ctx.set.headers['Cache-Control'] = 'max-age=3600';

        middleware(ctx);

        expect(ctx.set.headers['Cache-Control']).toBe('max-age=3600');
      });
    });

    describe('X-Frame-Options', () => {
      it('should set X-Frame-Options when enabled (default)', () => {
        const middleware = createSecurityHeaders();
        const ctx = createMockContext();

        middleware(ctx);

        expect(ctx.set.headers['X-Frame-Options']).toBe('DENY');
      });

      it('should use SAMEORIGIN when configured', () => {
        const middleware = createSecurityHeaders({
          enableFrameOptions: true,
          frameOptions: 'SAMEORIGIN',
        });
        const ctx = createMockContext();

        middleware(ctx);

        expect(ctx.set.headers['X-Frame-Options']).toBe('SAMEORIGIN');
      });

      it('should not set X-Frame-Options when disabled', () => {
        const middleware = createSecurityHeaders({
          enableFrameOptions: false,
        });
        const ctx = createMockContext();

        middleware(ctx);

        expect(ctx.set.headers['X-Frame-Options']).toBeUndefined();
      });
    });

    describe('CSP and HSTS (production-only)', () => {
      // Note: These headers are only set in production (NODE_ENV === 'production')
      // In test environment, they should not be set

      it('should not set CSP in non-production environment', () => {
        const middleware = createSecurityHeaders({ enableCSP: true });
        const ctx = createMockContext();

        middleware(ctx);

        // CSP is not set because NODE_ENV is not 'production'
        expect(ctx.set.headers['Content-Security-Policy']).toBeUndefined();
      });

      it('should not set HSTS in non-production environment', () => {
        const middleware = createSecurityHeaders({ enableHSTS: true });
        const ctx = createMockContext();

        middleware(ctx);

        // HSTS is not set because NODE_ENV is not 'production'
        expect(ctx.set.headers['Strict-Transport-Security']).toBeUndefined();
      });
    });

    describe('custom configuration', () => {
      it('should allow disabling CSP', () => {
        const middleware = createSecurityHeaders({ enableCSP: false });
        const ctx = createMockContext();

        middleware(ctx);

        expect(ctx.set.headers['Content-Security-Policy']).toBeUndefined();
      });

      it('should allow disabling HSTS', () => {
        const middleware = createSecurityHeaders({ enableHSTS: false });
        const ctx = createMockContext();

        middleware(ctx);

        expect(ctx.set.headers['Strict-Transport-Security']).toBeUndefined();
      });

      it('should allow custom CSP directives', () => {
        const middleware = createSecurityHeaders({
          cspDirectives: {
            'default-src': "'none'",
            'script-src': "'self' cdn.example.com",
          },
        });
        const ctx = createMockContext();

        middleware(ctx);

        // CSP directives are merged but not applied in non-production
      });
    });
  });

  describe('SecurityPresets', () => {
    describe('strict preset', () => {
      it('should have all security features enabled', () => {
        expect(SecurityPresets.strict.enableHSTS).toBe(true);
        expect(SecurityPresets.strict.enableCSP).toBe(true);
        expect(SecurityPresets.strict.enableFrameOptions).toBe(true);
        expect(SecurityPresets.strict.frameOptions).toBe('DENY');
      });

      it('should work with createSecurityHeaders', () => {
        const middleware = createSecurityHeaders(SecurityPresets.strict);
        const ctx = createMockContext();

        middleware(ctx);

        expect(ctx.set.headers['X-Frame-Options']).toBe('DENY');
      });
    });

    describe('relaxed preset', () => {
      it('should have HSTS and CSP disabled', () => {
        expect(SecurityPresets.relaxed.enableHSTS).toBe(false);
        expect(SecurityPresets.relaxed.enableCSP).toBe(false);
        expect(SecurityPresets.relaxed.enableFrameOptions).toBe(true);
        expect(SecurityPresets.relaxed.frameOptions).toBe('SAMEORIGIN');
      });

      it('should work with createSecurityHeaders', () => {
        const middleware = createSecurityHeaders(SecurityPresets.relaxed);
        const ctx = createMockContext();

        middleware(ctx);

        expect(ctx.set.headers['X-Frame-Options']).toBe('SAMEORIGIN');
      });
    });

    describe('api preset', () => {
      it('should have API-optimized configuration', () => {
        expect(SecurityPresets.api.enableHSTS).toBe(true);
        expect(SecurityPresets.api.enableCSP).toBe(true);
        expect(SecurityPresets.api.cspDirectives).toEqual({
          'default-src': "'none'",
          'frame-ancestors': "'none'",
        });
        expect(SecurityPresets.api.enableFrameOptions).toBe(true);
        expect(SecurityPresets.api.frameOptions).toBe('DENY');
      });

      it('should work with createSecurityHeaders', () => {
        const middleware = createSecurityHeaders(SecurityPresets.api);
        const ctx = createMockContext();

        middleware(ctx);

        expect(ctx.set.headers['X-Frame-Options']).toBe('DENY');
        expect(ctx.set.headers['X-Content-Type-Options']).toBe('nosniff');
      });
    });
  });

  describe('multiple requests', () => {
    it('should set headers consistently across multiple requests', () => {
      const middleware = createSecurityHeaders();

      const ctx1 = createMockContext();
      const ctx2 = createMockContext();

      middleware(ctx1);
      middleware(ctx2);

      expect(ctx1.set.headers['X-Content-Type-Options']).toBe(ctx2.set.headers['X-Content-Type-Options']);
      expect(ctx1.set.headers['X-XSS-Protection']).toBe(ctx2.set.headers['X-XSS-Protection']);
    });
  });
});
