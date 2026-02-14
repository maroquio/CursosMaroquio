import { HttpStatus, HttpResponseFactory } from './HttpResponse.ts';

/**
 * Creates Response objects for middleware error handling
 * Middleware needs to return Response objects, not plain objects
 *
 * This utility wraps HttpResponseFactory to create proper Response instances
 * with correct headers and status codes.
 */
export const MiddlewareErrorResponse = {
  /**
   * Create unauthorized Response
   * Use when authentication is required but not provided or invalid
   */
  unauthorized(message: string = 'Unauthorized'): Response {
    const body = HttpResponseFactory.unauthorized(message);
    return new Response(JSON.stringify(body), {
      status: HttpStatus.UNAUTHORIZED,
      headers: { 'Content-Type': 'application/json' },
    });
  },

  /**
   * Create forbidden Response
   * Use when user is authenticated but lacks required permissions
   */
  forbidden(message: string = 'Insufficient permissions'): Response {
    const body = HttpResponseFactory.forbidden(message);
    return new Response(JSON.stringify(body), {
      status: HttpStatus.FORBIDDEN,
      headers: { 'Content-Type': 'application/json' },
    });
  },

  /**
   * Create bad request Response
   * Use for validation errors or invalid input
   */
  badRequest(message: string): Response {
    const body = HttpResponseFactory.error(message, HttpStatus.BAD_REQUEST);
    return new Response(JSON.stringify(body), {
      status: HttpStatus.BAD_REQUEST,
      headers: { 'Content-Type': 'application/json' },
    });
  },

  /**
   * Create not found Response
   */
  notFound(message: string = 'Resource not found'): Response {
    const body = HttpResponseFactory.notFound(message);
    return new Response(JSON.stringify(body), {
      status: HttpStatus.NOT_FOUND,
      headers: { 'Content-Type': 'application/json' },
    });
  },

  /**
   * Create internal server error Response
   */
  internalError(message: string = 'Internal server error'): Response {
    const body = HttpResponseFactory.internalError(message);
    return new Response(JSON.stringify(body), {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
