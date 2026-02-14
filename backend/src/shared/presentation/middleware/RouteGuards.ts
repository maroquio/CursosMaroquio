import { HttpStatus, HttpResponseFactory, type HttpErrorResponse } from '../http/HttpResponse.ts';

/**
 * Authenticated user structure from JWT token
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  roles: string[];
}

/**
 * Auth middleware return type
 */
export type AuthMiddlewareResult = Response | { user: AuthenticatedUser };

/**
 * Admin middleware return type
 */
export type AdminMiddlewareResult = Response | void;

/**
 * Auth middleware function type
 */
export type AuthMiddlewareFn = (ctx: { request: Request }) => Promise<AuthMiddlewareResult>;

/**
 * Admin middleware function type
 */
export type AdminMiddlewareFn = (ctx: {
  request: Request;
  user: AuthenticatedUser;
}) => Promise<AdminMiddlewareResult>;

/**
 * Context passed to authenticated route handlers
 */
export interface AuthenticatedContext<TBody = unknown, TParams = unknown, TQuery = unknown> {
  body: TBody;
  params: TParams;
  query: TQuery;
  request: Request;
  set: { status: number };
  user: AuthenticatedUser;
}

/**
 * Handler function type for authenticated routes
 */
export type AuthenticatedHandler<
  TResult,
  TBody = unknown,
  TParams = unknown,
  TQuery = unknown,
> = (ctx: AuthenticatedContext<TBody, TParams, TQuery>) => Promise<TResult>;

/**
 * Create a guard that requires authentication
 *
 * Wraps a route handler to:
 * 1. Execute authentication middleware
 * 2. Return 401 error if not authenticated
 * 3. Pass authenticated user to handler
 *
 * @example
 * ```typescript
 * const handler = withAuth(authMiddleware)(async ({ user, body }) => {
 *   // user is guaranteed to be authenticated
 *   return HttpResponseFactory.ok({ userId: user.userId });
 * });
 * ```
 */
export function withAuth(authMiddleware: AuthMiddlewareFn) {
  return function <TResult, TBody = unknown, TParams = unknown, TQuery = unknown>(
    handler: AuthenticatedHandler<TResult, TBody, TParams, TQuery>
  ) {
    return async (ctx: {
      body: TBody;
      params: TParams;
      query: TQuery;
      request: Request;
      set: { status: number };
    }): Promise<TResult | HttpErrorResponse> => {
      // Execute auth middleware
      const authResult = await authMiddleware({ request: ctx.request });

      // Check if authentication failed
      if (authResult instanceof Response) {
        ctx.set.status = HttpStatus.UNAUTHORIZED;
        return HttpResponseFactory.unauthorized();
      }

      // Authentication succeeded, call handler with user
      return handler({
        ...ctx,
        user: authResult.user,
      });
    };
  };
}

/**
 * Create a guard that requires authentication AND admin role
 *
 * Wraps a route handler to:
 * 1. Execute authentication middleware
 * 2. Execute admin authorization middleware
 * 3. Return 401/403 errors if checks fail
 * 4. Pass authenticated admin user to handler
 *
 * @example
 * ```typescript
 * const handler = withAdmin(authMiddleware, adminMiddleware)(async ({ user, body }) => {
 *   // user is guaranteed to be an authenticated admin
 *   return HttpResponseFactory.ok({ message: 'Admin action completed' });
 * });
 * ```
 */
export function withAdmin(authMiddleware: AuthMiddlewareFn, adminMiddleware: AdminMiddlewareFn) {
  return function <TResult, TBody = unknown, TParams = unknown, TQuery = unknown>(
    handler: AuthenticatedHandler<TResult, TBody, TParams, TQuery>
  ) {
    return async (ctx: {
      body: TBody;
      params: TParams;
      query: TQuery;
      request: Request;
      set: { status: number };
    }): Promise<TResult | HttpErrorResponse> => {
      // Execute auth middleware
      const authResult = await authMiddleware({ request: ctx.request });

      // Check if authentication failed
      if (authResult instanceof Response) {
        ctx.set.status = HttpStatus.UNAUTHORIZED;
        return HttpResponseFactory.unauthorized();
      }

      // Execute admin middleware
      const adminResult = await adminMiddleware({
        request: ctx.request,
        user: authResult.user,
      });

      // Check if admin authorization failed
      if (adminResult instanceof Response) {
        ctx.set.status = HttpStatus.FORBIDDEN;
        return HttpResponseFactory.forbidden();
      }

      // Both checks passed, call handler with user
      return handler({
        ...ctx,
        user: authResult.user,
      });
    };
  };
}

/**
 * Helper to check if result is an error response
 */
export function isErrorResponse(result: unknown): result is HttpErrorResponse {
  return (
    typeof result === 'object' &&
    result !== null &&
    'success' in result &&
    (result as { success: boolean }).success === false
  );
}
