import { describe, it, expect } from 'vitest';
import {
  HttpResponseFactory,
  HttpStatus,
  type HttpSuccessResponse,
  type HttpErrorResponse,
} from '@shared/presentation/http/HttpResponse.ts';
import { Result } from '@shared/domain/Result.ts';
import { DomainError, ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

describe('HttpStatus', () => {
  it('should have correct status codes', () => {
    expect(HttpStatus.OK).toBe(200);
    expect(HttpStatus.CREATED).toBe(201);
    expect(HttpStatus.NO_CONTENT).toBe(204);
    expect(HttpStatus.BAD_REQUEST).toBe(400);
    expect(HttpStatus.UNAUTHORIZED).toBe(401);
    expect(HttpStatus.FORBIDDEN).toBe(403);
    expect(HttpStatus.NOT_FOUND).toBe(404);
    expect(HttpStatus.CONFLICT).toBe(409);
    expect(HttpStatus.UNPROCESSABLE_ENTITY).toBe(422);
    expect(HttpStatus.INTERNAL_SERVER_ERROR).toBe(500);
  });
});

describe('HttpResponseFactory', () => {
  describe('ok()', () => {
    it('should create success response with data', () => {
      const data = { id: '123', name: 'Test' };
      const response = HttpResponseFactory.ok(data);

      expect(response.statusCode).toBe(200);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBeUndefined();
    });

    it('should create success response with message', () => {
      const data = { value: 42 };
      const response = HttpResponseFactory.ok(data, 'Operation successful');

      expect(response.statusCode).toBe(200);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBe('Operation successful');
    });

    it('should handle null data', () => {
      const response = HttpResponseFactory.ok(null);

      expect(response.statusCode).toBe(200);
      expect(response.success).toBe(true);
      expect(response.data).toBeNull();
    });

    it('should handle array data', () => {
      const data = [1, 2, 3];
      const response = HttpResponseFactory.ok(data);

      expect(response.data).toEqual([1, 2, 3]);
    });
  });

  describe('created()', () => {
    it('should create 201 response with data', () => {
      const data = { id: 'new-id', name: 'New Resource' };
      const response = HttpResponseFactory.created(data);

      expect(response.statusCode).toBe(201);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBe('Resource created successfully');
    });

    it('should create 201 response with custom message', () => {
      const data = { id: '456' };
      const response = HttpResponseFactory.created(data, 'User registered');

      expect(response.statusCode).toBe(201);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBe('User registered');
    });

    it('should create 201 response without data', () => {
      const response = HttpResponseFactory.created();

      expect(response.statusCode).toBe(201);
      expect(response.success).toBe(true);
      expect(response.data).toBeUndefined();
      expect(response.message).toBe('Resource created successfully');
    });
  });

  describe('noContent()', () => {
    it('should create 204 response', () => {
      const response = HttpResponseFactory.noContent();

      expect(response.statusCode).toBe(204);
      expect(response.success).toBe(true);
      expect(response.data).toBeUndefined();
      expect(response.message).toBeUndefined();
    });
  });

  describe('fromResult()', () => {
    it('should create error from failed Result with DomainError', () => {
      const domainError = new DomainError(
        ErrorCode.USER_NOT_FOUND,
        'User with ID 123 not found',
        { userId: '123' }
      );
      const result = Result.fail<string>(domainError);
      const response = HttpResponseFactory.fromResult(result);

      expect(response.statusCode).toBe(404); // USER_NOT_FOUND maps to 404
      expect(response.success).toBe(false);
      expect(response.error).toBe('User with ID 123 not found');
      expect(response.code).toBe(ErrorCode.USER_NOT_FOUND);
      expect(response.details).toEqual({ userId: '123' });
    });

    it('should create error from failed Result with DomainError without details', () => {
      const domainError = new DomainError(ErrorCode.CONFLICT, 'Resource conflict');
      const result = Result.fail<string>(domainError);
      const response = HttpResponseFactory.fromResult(result);

      expect(response.statusCode).toBe(409);
      expect(response.success).toBe(false);
      expect(response.error).toBe('Resource conflict');
      expect(response.code).toBe(ErrorCode.CONFLICT);
      expect(response.details).toBeUndefined();
    });

    it('should create error from failed Result with Error instance', () => {
      const error = new Error('Something went wrong');
      const result = Result.fail<string>(error);
      const response = HttpResponseFactory.fromResult(result);

      expect(response.statusCode).toBe(400);
      expect(response.success).toBe(false);
      expect(response.error).toBe('Something went wrong');
    });

    it('should create error from failed Result with string', () => {
      const result = Result.fail<string>('Simple error message');
      const response = HttpResponseFactory.fromResult(result);

      expect(response.statusCode).toBe(400);
      expect(response.success).toBe(false);
      expect(response.error).toBe('Simple error message');
    });

    it('should use custom status code when provided', () => {
      const result = Result.fail<string>('Error message');
      const response = HttpResponseFactory.fromResult(result, 422);

      expect(response.statusCode).toBe(422);
      expect(response.success).toBe(false);
    });

    it('should use error code mapping for status when DomainError has known code', () => {
      const domainError = new DomainError(ErrorCode.UNAUTHORIZED);
      const result = Result.fail<string>(domainError);
      const response = HttpResponseFactory.fromResult(result, 400);

      // Should use 401 from mapping, not the provided 400
      expect(response.statusCode).toBe(401);
    });

    it('should fallback to provided status when error code has no mapping', () => {
      const domainError = new DomainError(ErrorCode.INTERNAL_ERROR);
      const result = Result.fail<string>(domainError);
      const response = HttpResponseFactory.fromResult(result, 500);

      expect(response.statusCode).toBe(500);
    });
  });

  describe('error()', () => {
    it('should create error response with message', () => {
      const response = HttpResponseFactory.error('Validation failed');

      expect(response.statusCode).toBe(400);
      expect(response.success).toBe(false);
      expect(response.error).toBe('Validation failed');
      expect(response.code).toBeUndefined();
    });

    it('should create error response with custom status', () => {
      const response = HttpResponseFactory.error('Server error', 500);

      expect(response.statusCode).toBe(500);
      expect(response.success).toBe(false);
      expect(response.error).toBe('Server error');
    });

    it('should create error response with error code', () => {
      const response = HttpResponseFactory.error(
        'Invalid email format',
        400,
        ErrorCode.INVALID_EMAIL_FORMAT
      );

      expect(response.statusCode).toBe(400);
      expect(response.success).toBe(false);
      expect(response.error).toBe('Invalid email format');
      expect(response.code).toBe(ErrorCode.INVALID_EMAIL_FORMAT);
    });
  });

  describe('notFound()', () => {
    it('should create 404 response with default message', () => {
      const response = HttpResponseFactory.notFound();

      expect(response.statusCode).toBe(404);
      expect(response.success).toBe(false);
      expect(response.error).toBe('Resource not found');
      expect(response.code).toBe(ErrorCode.NOT_FOUND);
    });

    it('should create 404 response with custom message', () => {
      const response = HttpResponseFactory.notFound('User not found');

      expect(response.statusCode).toBe(404);
      expect(response.success).toBe(false);
      expect(response.error).toBe('User not found');
      expect(response.code).toBe(ErrorCode.NOT_FOUND);
    });
  });

  describe('conflict()', () => {
    it('should create 409 response', () => {
      const response = HttpResponseFactory.conflict('Email already exists');

      expect(response.statusCode).toBe(409);
      expect(response.success).toBe(false);
      expect(response.error).toBe('Email already exists');
      expect(response.code).toBe(ErrorCode.CONFLICT);
    });
  });

  describe('internalError()', () => {
    it('should create 500 response with default message', () => {
      const response = HttpResponseFactory.internalError();

      expect(response.statusCode).toBe(500);
      expect(response.success).toBe(false);
      expect(response.error).toBe('Internal server error');
      expect(response.code).toBe(ErrorCode.INTERNAL_ERROR);
    });

    it('should create 500 response with custom message', () => {
      const response = HttpResponseFactory.internalError('Database connection failed');

      expect(response.statusCode).toBe(500);
      expect(response.success).toBe(false);
      expect(response.error).toBe('Database connection failed');
      expect(response.code).toBe(ErrorCode.INTERNAL_ERROR);
    });
  });

  describe('unauthorized()', () => {
    it('should create 401 response with default message', () => {
      const response = HttpResponseFactory.unauthorized();

      expect(response.statusCode).toBe(401);
      expect(response.success).toBe(false);
      expect(response.error).toBe('Unauthorized');
      expect(response.code).toBe(ErrorCode.UNAUTHORIZED);
    });

    it('should create 401 response with custom message', () => {
      const response = HttpResponseFactory.unauthorized('Invalid token');

      expect(response.statusCode).toBe(401);
      expect(response.success).toBe(false);
      expect(response.error).toBe('Invalid token');
      expect(response.code).toBe(ErrorCode.UNAUTHORIZED);
    });
  });

  describe('forbidden()', () => {
    it('should create 403 response with default message', () => {
      const response = HttpResponseFactory.forbidden();

      expect(response.statusCode).toBe(403);
      expect(response.success).toBe(false);
      expect(response.error).toBe('Insufficient permissions');
      expect(response.code).toBe(ErrorCode.FORBIDDEN);
    });

    it('should create 403 response with custom message', () => {
      const response = HttpResponseFactory.forbidden('Admin access required');

      expect(response.statusCode).toBe(403);
      expect(response.success).toBe(false);
      expect(response.error).toBe('Admin access required');
      expect(response.code).toBe(ErrorCode.FORBIDDEN);
    });
  });
});
