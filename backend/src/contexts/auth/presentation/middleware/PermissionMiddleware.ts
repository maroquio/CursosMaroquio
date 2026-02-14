import type { Context } from 'elysia';
import type { AuthenticatedUser } from './AuthMiddleware.ts';
import type { IPermissionService } from '../../domain/services/IPermissionService.ts';
import { UserId } from '../../domain/value-objects/UserId.ts';
import { MiddlewareErrorResponse } from '@shared/presentation/http/ErrorResponse.ts';
import { localeDetector, getTranslatorSync } from '@shared/infrastructure/i18n/index.js';

/**
 * Context with authenticated user
 */
interface AuthContext extends Context {
  user?: AuthenticatedUser;
}

/**
 * PermissionMiddlewareFactory
 * Creates middleware functions that check user permissions against the database
 *
 * Unlike role-based authorization (which uses JWT claims), permission checks
 * query the database in real-time. This allows for immediate permission revocation
 * but comes with a small performance cost.
 *
 * Use roles for coarse-grained access control (fast, JWT-based)
 * Use permissions for fine-grained access control (real-time, database-based)
 */
export class PermissionMiddlewareFactory {
  constructor(private permissionService: IPermissionService) {}

  /**
   * Create middleware that checks if user has a specific permission
   * Supports i18n by detecting locale from request headers
   *
   * @param requiredPermission - Permission required to access the endpoint (e.g., "users:read")
   */
  requirePermission(requiredPermission: string) {
    return async (ctx: AuthContext): Promise<Response | void> => {
      // Get translator for the request's locale
      const locale = localeDetector.detect(ctx.request);
      const t = getTranslatorSync(locale);

      // User must be authenticated first
      if (!ctx.user) {
        return MiddlewareErrorResponse.unauthorized(t.middleware.authRequired());
      }

      // Parse user ID
      const userIdResult = UserId.createFromString(ctx.user.userId);
      if (userIdResult.isFailure) {
        return MiddlewareErrorResponse.unauthorized(t.middleware.invalidSession());
      }
      const userId = userIdResult.getValue();

      // Check permission in database
      const hasPermission = await this.permissionService.userHasPermission(
        userId,
        requiredPermission
      );

      if (!hasPermission) {
        return MiddlewareErrorResponse.forbidden(t.middleware.permissionRequired({ permission: requiredPermission }));
      }

      // User has required permission, continue
      return;
    };
  }

  /**
   * Create middleware that checks if user has ANY of the specified permissions
   * Supports i18n by detecting locale from request headers
   *
   * @param permissions - List of permissions, user needs at least one
   */
  requireAnyPermission(permissions: string[]) {
    return async (ctx: AuthContext): Promise<Response | void> => {
      // Get translator for the request's locale
      const locale = localeDetector.detect(ctx.request);
      const t = getTranslatorSync(locale);

      // User must be authenticated first
      if (!ctx.user) {
        return MiddlewareErrorResponse.unauthorized(t.middleware.authRequired());
      }

      // Parse user ID
      const userIdResult = UserId.createFromString(ctx.user.userId);
      if (userIdResult.isFailure) {
        return MiddlewareErrorResponse.unauthorized(t.middleware.invalidSession());
      }
      const userId = userIdResult.getValue();

      // Check if user has any of the permissions
      const hasAny = await this.permissionService.userHasAnyPermission(
        userId,
        permissions
      );

      if (!hasAny) {
        return MiddlewareErrorResponse.forbidden(
          t.middleware.anyPermissionRequired({ permissions: permissions.join(', ') })
        );
      }

      // User has at least one required permission, continue
      return;
    };
  }

  /**
   * Create middleware that checks if user has ALL of the specified permissions
   * Supports i18n by detecting locale from request headers
   *
   * @param permissions - List of permissions, user needs all of them
   */
  requireAllPermissions(permissions: string[]) {
    return async (ctx: AuthContext): Promise<Response | void> => {
      // Get translator for the request's locale
      const locale = localeDetector.detect(ctx.request);
      const t = getTranslatorSync(locale);

      // User must be authenticated first
      if (!ctx.user) {
        return MiddlewareErrorResponse.unauthorized(t.middleware.authRequired());
      }

      // Parse user ID
      const userIdResult = UserId.createFromString(ctx.user.userId);
      if (userIdResult.isFailure) {
        return MiddlewareErrorResponse.unauthorized(t.middleware.invalidSession());
      }
      const userId = userIdResult.getValue();

      // Check if user has all permissions
      const hasAll = await this.permissionService.userHasAllPermissions(
        userId,
        permissions
      );

      if (!hasAll) {
        return MiddlewareErrorResponse.forbidden(
          t.middleware.allPermissionsRequired({ permissions: permissions.join(', ') })
        );
      }

      // User has all required permissions, continue
      return;
    };
  }
}
