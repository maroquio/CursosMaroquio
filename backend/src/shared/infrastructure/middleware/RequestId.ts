/**
 * Request ID Middleware
 * Generates and propagates unique request identifiers for traceability
 *
 * Features:
 * - Generates UUID v7 for new requests (time-sortable)
 * - Accepts existing X-Request-ID header from upstream
 * - Adds X-Request-ID to response headers
 * - Stores requestId in context for logging/metrics
 */

/**
 * Generate UUID v7 (time-ordered UUID)
 * This provides better database indexing and natural time ordering
 */
function generateUUIDv7(): string {
  // Get current timestamp in milliseconds
  const timestamp = Date.now();

  // UUID v7 structure: timestamp (48 bits) + version (4 bits) + random (12 bits) + variant (2 bits) + random (62 bits)
  const timestampHex = timestamp.toString(16).padStart(12, '0');

  // Random bits
  const randomBits = crypto.getRandomValues(new Uint8Array(10));
  const randomHex = Array.from(randomBits)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Build UUID v7
  const uuid = [
    timestampHex.slice(0, 8), // time_high
    timestampHex.slice(8, 12), // time_mid
    '7' + randomHex.slice(0, 3), // version (7) + random
    ((parseInt(randomHex.slice(3, 5), 16) & 0x3f) | 0x80)
      .toString(16)
      .padStart(2, '0') + randomHex.slice(5, 7), // variant (10xx) + random
    randomHex.slice(7, 19), // random
  ].join('-');

  return uuid;
}

/**
 * Request ID header name
 */
export const REQUEST_ID_HEADER = 'X-Request-ID';

/**
 * Request context with request ID
 */
export interface RequestContext {
  requestId: string;
  startTime: number;
}

/**
 * Store for request context (using WeakMap with request as key)
 * This allows garbage collection when request is done
 */
const requestContextStore = new WeakMap<Request, RequestContext>();

/**
 * Get request context from store
 */
export function getRequestContext(request: Request): RequestContext | undefined {
  return requestContextStore.get(request);
}

/**
 * Get request ID from request
 */
export function getRequestId(request: Request): string | undefined {
  return requestContextStore.get(request)?.requestId;
}

/**
 * Create Request ID middleware for Elysia
 *
 * Usage:
 * ```typescript
 * app.onBeforeHandle(createRequestIdMiddleware())
 *    .onAfterHandle(addRequestIdToResponse())
 * ```
 */
export function createRequestIdMiddleware() {
  return (ctx: { request: Request; set: { headers: Record<string, string | number> } }) => {
    // Check for existing request ID from upstream (e.g., load balancer, API gateway)
    const existingId = ctx.request.headers.get(REQUEST_ID_HEADER);
    const requestId = existingId || generateUUIDv7();

    // Store in context map
    requestContextStore.set(ctx.request, {
      requestId,
      startTime: Date.now(),
    });

    // Set header for response
    ctx.set.headers[REQUEST_ID_HEADER] = requestId;

    return undefined; // Continue to next handler
  };
}

/**
 * Add request ID and timing to response
 * Should be used in onAfterHandle
 */
export function addRequestIdToResponse() {
  return (ctx: { request: Request; set: { headers: Record<string, string | number> } }) => {
    const context = requestContextStore.get(ctx.request);

    if (context) {
      // Ensure header is set (in case it wasn't set in onBeforeHandle)
      if (!ctx.set.headers[REQUEST_ID_HEADER]) {
        ctx.set.headers[REQUEST_ID_HEADER] = context.requestId;
      }

      // Add response time header
      const duration = Date.now() - context.startTime;
      ctx.set.headers['X-Response-Time'] = `${duration}ms`;
    }

    return undefined;
  };
}

/**
 * Logger utility with request ID context
 * Usage in handlers:
 * ```typescript
 * const logger = createRequestLogger(ctx.request);
 * logger.info('Processing request');
 * ```
 */
export interface RequestLogger {
  debug: (message: string, data?: Record<string, unknown>) => void;
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
}

export function createRequestLogger(request: Request): RequestLogger {
  const context = getRequestContext(request);
  const requestId = context?.requestId || 'unknown';

  const log = (level: string, message: string, data?: Record<string, unknown>) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      requestId,
      message,
      ...(data && { data }),
    };

    // In production, this would be structured JSON logging
    // For now, we output to console
    const output = JSON.stringify(logEntry);

    switch (level) {
      case 'debug':
        console.debug(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
        console.error(output);
        break;
      default:
        console.log(output);
    }
  };

  return {
    debug: (message, data) => log('debug', message, data),
    info: (message, data) => log('info', message, data),
    warn: (message, data) => log('warn', message, data),
    error: (message, data) => log('error', message, data),
  };
}
