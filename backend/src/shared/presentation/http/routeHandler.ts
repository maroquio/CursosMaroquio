import type { Result } from '@shared/domain/Result.ts';
import type { AuthenticatedUser } from '@auth/presentation/middleware/AuthMiddleware.ts';

type MiddlewareFn = (ctx: any) => Promise<any>;

interface RouteOptions<T> {
  middleware?: MiddlewareFn;
  handler: (ctx: any, user?: AuthenticatedUser) => Promise<Result<T>>;
  successStatus?: number;
}

/**
 * Creates a route handler that:
 * 1. Runs optional auth middleware
 * 2. Calls handler with context and authenticated user
 * 3. Returns standardized success/error response
 */
export function handleRoute<T>(options: RouteOptions<T>) {
  return async (ctx: any) => {
    if (options.middleware) {
      const authResult = await options.middleware({ request: ctx.request } as any);
      if (authResult instanceof Response) {
        ctx.set.status = authResult.status;
        return authResult.json();
      }

      // Run handler with authenticated user
      const user = authResult.user as AuthenticatedUser;
      const result = await options.handler(ctx, user);
      return toResponse(ctx, result, options.successStatus);
    }

    // No middleware - public route
    const result = await options.handler(ctx);
    return toResponse(ctx, result, options.successStatus);
  };
}

function toResponse<T>(ctx: any, result: Result<T>, successStatus = 200) {
  if (result.isFailure) {
    ctx.set.status = 400;
    return { statusCode: 400, success: false, error: String(result.getError()) };
  }

  ctx.set.status = successStatus;
  if (successStatus === 204) {
    return null;
  }
  return { statusCode: successStatus, success: true, data: result.getValue() };
}
