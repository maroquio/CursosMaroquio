import type { Context } from 'elysia';
import { createLogger, type ILogger } from '../logging/Logger.ts';
import { CryptoUtils } from '../crypto/CryptoUtils.ts';

/**
 * Request Logger Configuration
 */
interface RequestLoggerConfig {
  /** Skip logging for specific paths (e.g., health checks) */
  skipPaths?: string[];
  /** Log request body (be careful with sensitive data) */
  logBody?: boolean;
  /** Log response body */
  logResponse?: boolean;
  /** Maximum body length to log */
  maxBodyLength?: number;
  /** Custom logger instance */
  logger?: ILogger;
}

/**
 * Request metadata for logging
 */
interface RequestMetadata {
  requestId: string;
  method: string;
  path: string;
  query?: Record<string, string>;
  ip: string;
  userAgent?: string;
  contentType?: string;
  contentLength?: number;
}

/**
 * Response metadata for logging
 */
interface ResponseMetadata {
  requestId: string;
  statusCode: number;
  duration: number;
  contentType?: string;
  contentLength?: number;
}

/**
 * Default configuration
 */
const defaultConfig: Required<Omit<RequestLoggerConfig, 'logger'>> & { logger: ILogger | undefined } = {
  skipPaths: ['/health', '/ready', '/metrics'],
  logBody: false,
  logResponse: false,
  maxBodyLength: 1000,
  logger: undefined,
};

/**
 * Extract IP address from request
 */
function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0]?.trim() ?? 'unknown';
  }
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }
  return 'unknown';
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return CryptoUtils.randomHex(16);
}

/**
 * Create Request Logger Middleware
 *
 * Logs incoming requests and their responses with timing information.
 * Useful for observability, debugging, and audit trails.
 *
 * @example
 * const app = new Elysia()
 *   .onBeforeHandle(createRequestLogger())
 *   .get('/api/users', ...)
 *
 * // With configuration
 * const app = new Elysia()
 *   .onBeforeHandle(createRequestLogger({
 *     skipPaths: ['/health'],
 *     logBody: true,
 *   }))
 */
export function createRequestLogger(config: RequestLoggerConfig = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  const logger = finalConfig.logger ?? createLogger('HTTP');

  return async (ctx: Context) => {
    const url = new URL(ctx.request.url);
    const path = url.pathname;

    // Skip logging for configured paths
    if (finalConfig.skipPaths.some((p) => path.startsWith(p))) {
      return;
    }

    const startTime = performance.now();
    const requestId = generateRequestId();

    // Attach request ID to context for downstream use
    (ctx as any).requestId = requestId;

    // Build request metadata
    const requestMeta: RequestMetadata = {
      requestId,
      method: ctx.request.method,
      path,
      ip: getClientIp(ctx.request),
      userAgent: ctx.request.headers.get('user-agent') ?? undefined,
      contentType: ctx.request.headers.get('content-type') ?? undefined,
    };

    // Add query parameters if present
    if (url.search) {
      requestMeta.query = Object.fromEntries(url.searchParams);
    }

    // Add content length if present
    const contentLength = ctx.request.headers.get('content-length');
    if (contentLength) {
      requestMeta.contentLength = parseInt(contentLength, 10);
    }

    // Log incoming request
    logger.info('Incoming request', requestMeta as any);

    // Add response header with request ID
    ctx.set.headers['X-Request-ID'] = requestId;

    // Store start time for response logging
    (ctx as any).__requestStartTime = startTime;
    (ctx as any).__requestId = requestId;
  };
}

/**
 * Create Response Logger Middleware (for onAfterHandle)
 *
 * Call this in onAfterHandle to log response details.
 *
 * @example
 * const app = new Elysia()
 *   .onBeforeHandle(createRequestLogger())
 *   .onAfterHandle(createResponseLogger())
 */
export function createResponseLogger(config: RequestLoggerConfig = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  const logger = finalConfig.logger ?? createLogger('HTTP');

  return async (ctx: Context & { response: unknown }) => {
    const startTime = (ctx as any).__requestStartTime;
    const requestId = (ctx as any).__requestId;

    if (!startTime || !requestId) {
      return ctx.response;
    }

    const duration = Math.round(performance.now() - startTime);
    const url = new URL(ctx.request.url);
    const path = url.pathname;

    // Skip logging for configured paths
    if (finalConfig.skipPaths.some((p) => path.startsWith(p))) {
      return ctx.response;
    }

    // Determine status code
    let statusCode = 200;
    if (ctx.set.status && typeof ctx.set.status === 'number') {
      statusCode = ctx.set.status;
    } else if (ctx.response && typeof ctx.response === 'object' && 'statusCode' in ctx.response) {
      statusCode = (ctx.response as any).statusCode;
    }

    const responseMeta: ResponseMetadata = {
      requestId,
      statusCode,
      duration,
    };

    // Log level based on status code
    if (statusCode >= 500) {
      logger.error('Request completed', undefined, responseMeta as any);
    } else if (statusCode >= 400) {
      logger.warn('Request completed', responseMeta as any);
    } else {
      logger.info('Request completed', responseMeta as any);
    }

    return ctx.response;
  };
}

/**
 * Combined request/response logger using Elysia's trace
 *
 * Alternative approach using a single configuration point.
 */
export function createRequestResponseLogger(config: RequestLoggerConfig = {}) {
  return {
    onBeforeHandle: createRequestLogger(config),
    onAfterHandle: createResponseLogger(config),
  };
}
