import type { Context } from 'elysia';
import type { AuthenticatedUser } from './AuthMiddleware.ts';
import { MiddlewareErrorResponse } from '@shared/presentation/http/ErrorResponse.ts';
import { localeDetector, getTranslatorSync } from '@shared/infrastructure/i18n/index.js';

/**
 * Context with authenticated user
 */
interface AuthContext extends Context {
  user?: AuthenticatedUser;
}

/**
 * Create authorization middleware that checks if user has required role(s)
 * Supports i18n by detecting locale from request headers
 *
 * @param requiredRoles - Role(s) required to access the endpoint
 * @param requireAll - If true, user must have ALL roles. If false, user needs ANY role (default: false)
 */
export function createRoleMiddleware(
  requiredRoles: string | string[],
  requireAll: boolean = false
) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return async (ctx: AuthContext): Promise<Response | void> => {
    // Get translator for the request's locale
    const locale = localeDetector.detect(ctx.request);
    const t = getTranslatorSync(locale);

    // User must be authenticated first
    if (!ctx.user) {
      return MiddlewareErrorResponse.unauthorized(t.middleware.authRequired());
    }

    const userRoles = ctx.user.roles || [];

    // Check role requirements
    const hasAccess = requireAll
      ? roles.every((role) => userRoles.includes(role))
      : roles.some((role) => userRoles.includes(role));

    if (!hasAccess) {
      return MiddlewareErrorResponse.forbidden(t.middleware.insufficientPermissions());
    }

    // User has required role(s), continue
    return;
  };
}

/**
 * Require admin role
 * Shorthand for createRoleMiddleware('admin')
 */
export const requireAdmin = () => createRoleMiddleware('admin');

/**
 * Require user role
 * Shorthand for createRoleMiddleware('user')
 */
export const requireUser = () => createRoleMiddleware('user');

/**
 * Require any of the specified roles
 * User must have at least one of the roles
 */
export const requireAnyRole = (roles: string[]) =>
  createRoleMiddleware(roles, false);

/**
 * Require all of the specified roles
 * User must have all of the roles
 */
export const requireAllRoles = (roles: string[]) =>
  createRoleMiddleware(roles, true);
