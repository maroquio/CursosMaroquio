import { describe, it, expect } from 'vitest';
import { MiddlewareErrorResponse } from '@shared/presentation/http/ErrorResponse.ts';
import { HttpStatus } from '@shared/presentation/http/HttpResponse.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

describe('MiddlewareErrorResponse', () => {
  describe('unauthorized()', () => {
    it('should return Response with 401 status', async () => {
      const response = MiddlewareErrorResponse.unauthorized();

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should return Response with JSON content-type', async () => {
      const response = MiddlewareErrorResponse.unauthorized();

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should return Response with default message', async () => {
      const response = MiddlewareErrorResponse.unauthorized();
      const body = await response.json() as { success: boolean; error: string; statusCode: number; code: string };

      expect(body.statusCode).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Unauthorized');
      expect(body.code).toBe(ErrorCode.UNAUTHORIZED);
    });

    it('should return Response with custom message', async () => {
      const response = MiddlewareErrorResponse.unauthorized('Token expired');
      const body = await response.json() as { error: string };

      expect(body.error).toBe('Token expired');
    });
  });

  describe('forbidden()', () => {
    it('should return Response with 403 status', async () => {
      const response = MiddlewareErrorResponse.forbidden();

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });

    it('should return Response with JSON content-type', async () => {
      const response = MiddlewareErrorResponse.forbidden();

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should return Response with default message', async () => {
      const response = MiddlewareErrorResponse.forbidden();
      const body = await response.json() as { success: boolean; error: string; statusCode: number; code: string };

      expect(body.statusCode).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Insufficient permissions');
      expect(body.code).toBe(ErrorCode.FORBIDDEN);
    });

    it('should return Response with custom message', async () => {
      const response = MiddlewareErrorResponse.forbidden('Admin role required');
      const body = await response.json() as { error: string };

      expect(body.error).toBe('Admin role required');
    });
  });

  describe('badRequest()', () => {
    it('should return Response with 400 status', async () => {
      const response = MiddlewareErrorResponse.badRequest('Invalid input');

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should return Response with JSON content-type', async () => {
      const response = MiddlewareErrorResponse.badRequest('Invalid input');

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should return Response with custom message', async () => {
      const response = MiddlewareErrorResponse.badRequest('Email format is invalid');
      const body = await response.json() as { success: boolean; error: string; statusCode: number };

      expect(body.statusCode).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Email format is invalid');
    });
  });

  describe('notFound()', () => {
    it('should return Response with 404 status', async () => {
      const response = MiddlewareErrorResponse.notFound();

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(HttpStatus.NOT_FOUND);
    });

    it('should return Response with JSON content-type', async () => {
      const response = MiddlewareErrorResponse.notFound();

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should return Response with default message', async () => {
      const response = MiddlewareErrorResponse.notFound();
      const body = await response.json() as { success: boolean; error: string; statusCode: number; code: string };

      expect(body.statusCode).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Resource not found');
      expect(body.code).toBe(ErrorCode.NOT_FOUND);
    });

    it('should return Response with custom message', async () => {
      const response = MiddlewareErrorResponse.notFound('User with ID 123 not found');
      const body = await response.json() as { error: string };

      expect(body.error).toBe('User with ID 123 not found');
    });
  });

  describe('internalError()', () => {
    it('should return Response with 500 status', async () => {
      const response = MiddlewareErrorResponse.internalError();

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should return Response with JSON content-type', async () => {
      const response = MiddlewareErrorResponse.internalError();

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should return Response with default message', async () => {
      const response = MiddlewareErrorResponse.internalError();
      const body = await response.json() as { success: boolean; error: string; statusCode: number; code: string };

      expect(body.statusCode).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Internal server error');
      expect(body.code).toBe(ErrorCode.INTERNAL_ERROR);
    });

    it('should return Response with custom message', async () => {
      const response = MiddlewareErrorResponse.internalError('Database connection failed');
      const body = await response.json() as { error: string };

      expect(body.error).toBe('Database connection failed');
    });
  });
});
