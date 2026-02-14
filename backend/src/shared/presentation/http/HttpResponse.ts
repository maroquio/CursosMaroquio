import { ErrorCode, DomainError, getErrorMessage } from '@shared/domain/errors/ErrorCodes.ts';
import { Result } from '@shared/domain/Result.ts';

/**
 * Standard HTTP response structure
 */
export interface HttpSuccessResponse<T = unknown> {
  statusCode: number;
  success: true;
  data?: T;
  message?: string;
}

export interface HttpErrorResponse {
  statusCode: number;
  success: false;
  error: string;
  code?: ErrorCode;
  details?: Record<string, unknown>;
}

export type HttpResponse<T = unknown> = HttpSuccessResponse<T> | HttpErrorResponse;

/**
 * HTTP status codes
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Error code to HTTP status mapping
 */
const errorCodeToStatus: Partial<Record<ErrorCode, number>> = {
  [ErrorCode.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.USER_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.CONFLICT]: HttpStatus.CONFLICT,
  [ErrorCode.USER_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ErrorCode.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.FORBIDDEN]: HttpStatus.FORBIDDEN,
  [ErrorCode.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
  [ErrorCode.INVALID_EMAIL_FORMAT]: HttpStatus.BAD_REQUEST,
  [ErrorCode.INVALID_PASSWORD]: HttpStatus.BAD_REQUEST,
  [ErrorCode.INVALID_UUID_FORMAT]: HttpStatus.BAD_REQUEST,
};

/**
 * HTTP Response factory
 * Creates standardized HTTP responses
 */
export const HttpResponseFactory = {
  /**
   * Create success response with data
   */
  ok<T>(data: T, message?: string): HttpSuccessResponse<T> {
    return {
      statusCode: HttpStatus.OK,
      success: true,
      data,
      ...(message && { message }),
    };
  },

  /**
   * Create created response
   */
  created<T>(data?: T, message?: string): HttpSuccessResponse<T> {
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      ...(data && { data }),
      message: message ?? 'Resource created successfully',
    };
  },

  /**
   * Create no content response
   */
  noContent(): HttpSuccessResponse {
    return {
      statusCode: HttpStatus.NO_CONTENT,
      success: true,
    };
  },

  /**
   * Create error response from Result
   */
  fromResult<T>(result: Result<T>, statusCode: number = HttpStatus.BAD_REQUEST): HttpErrorResponse {
    const error = result.getError();

    if (error instanceof DomainError) {
      return {
        statusCode: errorCodeToStatus[error.code] ?? statusCode,
        success: false,
        error: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
      };
    }

    return {
      statusCode,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  },

  /**
   * Create error response
   */
  error(
    message: string,
    statusCode: number = HttpStatus.BAD_REQUEST,
    code?: ErrorCode
  ): HttpErrorResponse {
    return {
      statusCode,
      success: false,
      error: message,
      ...(code && { code }),
    };
  },

  /**
   * Create not found response
   */
  notFound(message: string = 'Resource not found'): HttpErrorResponse {
    return {
      statusCode: HttpStatus.NOT_FOUND,
      success: false,
      error: message,
      code: ErrorCode.NOT_FOUND,
    };
  },

  /**
   * Create conflict response
   */
  conflict(message: string): HttpErrorResponse {
    return {
      statusCode: HttpStatus.CONFLICT,
      success: false,
      error: message,
      code: ErrorCode.CONFLICT,
    };
  },

  /**
   * Create internal server error response
   */
  internalError(message: string = 'Internal server error'): HttpErrorResponse {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      error: message,
      code: ErrorCode.INTERNAL_ERROR,
    };
  },

  /**
   * Create unauthorized response
   */
  unauthorized(message: string = 'Unauthorized'): HttpErrorResponse {
    return {
      statusCode: HttpStatus.UNAUTHORIZED,
      success: false,
      error: message,
      code: ErrorCode.UNAUTHORIZED,
    };
  },

  /**
   * Create forbidden response
   */
  forbidden(message: string = 'Insufficient permissions'): HttpErrorResponse {
    return {
      statusCode: HttpStatus.FORBIDDEN,
      success: false,
      error: message,
      code: ErrorCode.FORBIDDEN,
    };
  },
};
