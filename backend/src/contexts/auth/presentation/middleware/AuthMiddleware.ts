import type { Context } from 'elysia';
import type { ITokenService, TokenPayload } from '../../domain/services/ITokenService.ts';
import { MiddlewareErrorResponse } from '@shared/presentation/http/ErrorResponse.ts';
import { localeDetector, getTranslatorSync } from '@shared/infrastructure/i18n/index.js';

/**
 * Authenticated user context
 * Added to request after successful authentication
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  roles: string[];
}

/**
 * Create authentication middleware
 * Validates JWT access token and adds user to context
 * Supports i18n by detecting locale from request headers
 */
export function createAuthMiddleware(tokenService: ITokenService) {
  return async (ctx: Context): Promise<{ user: AuthenticatedUser } | Response> => {
    // Get translator for the request's locale
    const locale = localeDetector.detect(ctx.request);
    const t = getTranslatorSync(locale);

    const authHeader = ctx.request.headers.get('authorization');

    if (!authHeader) {
      return MiddlewareErrorResponse.unauthorized(t.http.authHeaderRequired());
    }

    // Check Bearer format
    if (!authHeader.startsWith('Bearer ')) {
      return MiddlewareErrorResponse.unauthorized(t.http.invalidAuthFormat());
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // Verify token
    const payload = tokenService.verifyAccessToken(token);

    if (!payload) {
      return MiddlewareErrorResponse.unauthorized(t.auth.token.expired());
    }

    // Return user for context (including roles from JWT)
    return {
      user: {
        userId: payload.userId,
        email: payload.email,
        roles: payload.roles || [],
      },
    };
  };
}

/**
 * Optional authentication middleware
 * Adds user to context if token is present, but doesn't fail if not
 */
export function createOptionalAuthMiddleware(tokenService: ITokenService) {
  return async (ctx: Context): Promise<{ user: AuthenticatedUser | null }> => {
    const authHeader = ctx.request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null };
    }

    const token = authHeader.substring(7);
    const payload = tokenService.verifyAccessToken(token);

    if (!payload) {
      return { user: null };
    }

    return {
      user: {
        userId: payload.userId,
        email: payload.email,
        roles: payload.roles || [],
      },
    };
  };
}

/**
 * Create permission middleware
 * Validates JWT access token and checks if user has the required permission
 * For now, checks if user has 'admin' role which grants all permissions
 * In the future, this could be enhanced to check specific permissions from the database
 *
 * @param tokenService - Token service for JWT verification
 * @param requiredPermission - Permission string (e.g., "courses:*") - used for future enhancement
 */
export function createPermissionMiddleware(tokenService: ITokenService, requiredPermission: string) {
  return async (ctx: Context): Promise<{ user: AuthenticatedUser } | Response> => {
    // Get translator for the request's locale
    const locale = localeDetector.detect(ctx.request);
    const t = getTranslatorSync(locale);

    const authHeader = ctx.request.headers.get('authorization');

    if (!authHeader) {
      return MiddlewareErrorResponse.unauthorized(t.http.authHeaderRequired());
    }

    // Check Bearer format
    if (!authHeader.startsWith('Bearer ')) {
      return MiddlewareErrorResponse.unauthorized(t.http.invalidAuthFormat());
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // Verify token
    const payload = tokenService.verifyAccessToken(token);

    if (!payload) {
      return MiddlewareErrorResponse.unauthorized(t.auth.token.expired());
    }

    // Check if user has admin role (admin role has all permissions)
    const roles = payload.roles || [];
    const isAdmin = roles.includes('admin');

    if (!isAdmin) {
      return MiddlewareErrorResponse.forbidden('Forbidden: insufficient permissions');
    }

    // Return user for context (including roles from JWT)
    return {
      user: {
        userId: payload.userId,
        email: payload.email,
        roles: payload.roles || [],
      },
    };
  };
}

/**
 * Helper to extract client info from request
 */
export function extractClientInfo(ctx: Context): {
  userAgent: string | undefined;
  ipAddress: string | undefined;
} {
  const userAgent = ctx.request.headers.get('user-agent') ?? undefined;

  // Get IP from common proxy headers
  const forwardedFor = ctx.request.headers.get('x-forwarded-for');
  const ipAddress =
    (forwardedFor ? forwardedFor.split(',')[0]?.trim() : undefined) ??
    ctx.request.headers.get('x-real-ip') ??
    undefined;

  return { userAgent, ipAddress };
}
