import type { Context } from 'elysia';
import { env } from '@shared/config/env.ts';

/**
 * Security Headers Configuration
 */
interface SecurityHeadersConfig {
  /** Enable Strict-Transport-Security (HTTPS only) */
  enableHSTS?: boolean;

  /** Enable Content-Security-Policy */
  enableCSP?: boolean;

  /** Custom CSP directives */
  cspDirectives?: Record<string, string>;

  /** Enable X-Frame-Options */
  enableFrameOptions?: boolean;

  /** Frame options value: DENY | SAMEORIGIN */
  frameOptions?: 'DENY' | 'SAMEORIGIN';
}

const defaultConfig: Required<SecurityHeadersConfig> = {
  enableHSTS: true,
  enableCSP: true,
  cspDirectives: {
    'default-src': "'self'",
    'script-src': "'self'",
    'style-src': "'self' 'unsafe-inline'", // Allow inline styles for Swagger UI
    'img-src': "'self' data:",
    'font-src': "'self'",
    'connect-src': "'self'",
    'frame-ancestors': "'none'",
  },
  enableFrameOptions: true,
  frameOptions: 'DENY',
};

/**
 * Build CSP header string from directives object
 */
function buildCSP(directives: Record<string, string>): string {
  return Object.entries(directives)
    .map(([key, value]) => `${key} ${value}`)
    .join('; ');
}

/**
 * Create security headers middleware
 * Adds security-related HTTP headers to all responses
 */
export function createSecurityHeaders(config: SecurityHeadersConfig = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  const isProduction = env.NODE_ENV === 'production';

  return (ctx: Context) => {
    // X-Content-Type-Options: Prevent MIME type sniffing
    ctx.set.headers['X-Content-Type-Options'] = 'nosniff';

    // X-XSS-Protection: Enable XSS filter (legacy but still useful)
    ctx.set.headers['X-XSS-Protection'] = '1; mode=block';

    // X-Frame-Options: Prevent clickjacking
    // EXCEPTION: Allow bundles to be loaded in iframes (for interactive sections)
    const url = new URL(ctx.request.url);
    const isBundlePath = /^\/uploads\/bundles\/[a-zA-Z0-9_\-\/]+\.(html|htm)$/.test(url.pathname);
    if (finalConfig.enableFrameOptions && !isBundlePath) {
      ctx.set.headers['X-Frame-Options'] = finalConfig.frameOptions;
    } else if (isBundlePath) {
      ctx.set.headers['X-Frame-Options'] = 'SAMEORIGIN';
    }

    // Referrer-Policy: Control referrer information
    ctx.set.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';

    // Permissions-Policy: Disable sensitive features
    ctx.set.headers['Permissions-Policy'] =
      'camera=(), microphone=(), geolocation=(), payment=()';

    // X-Permitted-Cross-Domain-Policies: Prevent Adobe Flash/PDF from loading
    ctx.set.headers['X-Permitted-Cross-Domain-Policies'] = 'none';

    // Content-Security-Policy: Only in production to not break dev tools
    if (finalConfig.enableCSP && isProduction) {
      const cspDirectives = {
        ...finalConfig.cspDirectives,
        ...(config.cspDirectives ?? {}),
      };

      // Allow bundles to be embedded in iframes only from same origin and configured CORS origins
      if (isBundlePath) {
        const corsOrigins = env.CORS_ORIGIN === '*' ? "'self'" : `'self' ${env.CORS_ORIGIN.split(',').join(' ')}`;
        cspDirectives['frame-ancestors'] = corsOrigins;
      }

      ctx.set.headers['Content-Security-Policy'] = buildCSP(cspDirectives);
    }

    // Strict-Transport-Security: Force HTTPS (only in production)
    if (finalConfig.enableHSTS && isProduction) {
      // max-age=1 year, include subdomains, allow preload list
      ctx.set.headers['Strict-Transport-Security'] =
        'max-age=31536000; includeSubDomains; preload';
    }

    // Cache-Control for API responses (no caching by default)
    if (!ctx.set.headers['Cache-Control']) {
      ctx.set.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate';
      ctx.set.headers['Pragma'] = 'no-cache';
      ctx.set.headers['Expires'] = '0';
    }
  };
}

/**
 * Preset security configurations
 */
export const SecurityPresets = {
  /** Strict: Maximum security (for production APIs) */
  strict: {
    enableHSTS: true,
    enableCSP: true,
    enableFrameOptions: true,
    frameOptions: 'DENY' as const,
  },

  /** Relaxed: Less strict (for development/internal APIs) */
  relaxed: {
    enableHSTS: false,
    enableCSP: false,
    enableFrameOptions: true,
    frameOptions: 'SAMEORIGIN' as const,
  },

  /** API: Optimized for API-only servers */
  api: {
    enableHSTS: true,
    enableCSP: true,
    cspDirectives: {
      'default-src': "'none'",
      'frame-ancestors': "'none'",
    },
    enableFrameOptions: true,
    frameOptions: 'DENY' as const,
  },
};
