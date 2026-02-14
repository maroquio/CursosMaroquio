/**
 * Pagination System
 * Provides standardized pagination for API responses
 *
 * Features:
 * - Query parameter parsing with validation
 * - Configurable defaults and limits
 * - Response envelope with metadata
 * - Support for sorting
 */

import { t } from 'elysia';

/**
 * Default pagination configuration
 */
export const PaginationDefaults = {
  page: 1,
  limit: 20,
  maxLimit: 100,
  defaultSort: 'createdAt',
  defaultOrder: 'desc' as const,
} as const;

/**
 * Sort order type
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Pagination query parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: SortOrder;
}

/**
 * Pagination metadata for response
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated response envelope
 */
export interface PaginatedResponse<T> {
  success: true;
  statusCode: number;
  data: T[];
  meta: PaginationMeta;
}

/**
 * Elysia schema for pagination query parameters
 * Use in route definition for automatic validation
 */
export const PaginationQuerySchema = t.Object({
  page: t.Optional(
    t.Numeric({
      minimum: 1,
      default: PaginationDefaults.page,
      description: 'Page number (1-indexed)',
    })
  ),
  limit: t.Optional(
    t.Numeric({
      minimum: 1,
      maximum: PaginationDefaults.maxLimit,
      default: PaginationDefaults.limit,
      description: `Number of items per page (max ${PaginationDefaults.maxLimit})`,
    })
  ),
  sort: t.Optional(
    t.String({
      description: 'Field to sort by',
      default: PaginationDefaults.defaultSort,
    })
  ),
  order: t.Optional(
    t.Union([t.Literal('asc'), t.Literal('desc')], {
      description: 'Sort order (asc or desc)',
      default: PaginationDefaults.defaultOrder,
    })
  ),
});

/**
 * Parse and validate pagination parameters from query string
 * Returns sanitized pagination params with defaults applied
 */
export function parsePaginationParams(query: {
  page?: string | number;
  limit?: string | number;
  sort?: string;
  order?: string;
}): PaginationParams {
  const page = Math.max(1, Number(query.page) || PaginationDefaults.page);
  const rawLimit = Number(query.limit) || PaginationDefaults.limit;
  const limit = Math.min(Math.max(1, rawLimit), PaginationDefaults.maxLimit);
  const sort = query.sort || PaginationDefaults.defaultSort;
  const order = query.order === 'asc' ? 'asc' : PaginationDefaults.defaultOrder;

  return { page, limit, sort, order };
}

/**
 * Calculate pagination metadata from total count and params
 */
export function calculatePaginationMeta(
  total: number,
  params: PaginationParams
): PaginationMeta {
  const totalPages = Math.ceil(total / params.limit);

  return {
    total,
    page: params.page,
    limit: params.limit,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrev: params.page > 1,
  };
}

/**
 * Calculate offset for database queries
 */
export function calculateOffset(params: PaginationParams): number {
  return (params.page - 1) * params.limit;
}

/**
 * Create paginated response envelope
 *
 * @example
 * ```typescript
 * const users = await repository.findAll(offset, limit);
 * const total = await repository.count();
 * return createPaginatedResponse(users, total, params);
 * ```
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams,
  statusCode: number = 200
): PaginatedResponse<T> {
  return {
    success: true,
    statusCode,
    data,
    meta: calculatePaginationMeta(total, params),
  };
}

/**
 * Allowed sort fields configuration
 * Use this to whitelist sortable fields and prevent SQL injection
 */
export type AllowedSortFields<T> = {
  [K in keyof T]?: true;
};

/**
 * Validate and sanitize sort field against allowed fields
 * Returns default sort field if requested field is not allowed
 */
export function validateSortField<T>(
  requestedSort: string,
  allowedFields: AllowedSortFields<T>,
  defaultField: keyof T
): keyof T {
  if (requestedSort in allowedFields) {
    return requestedSort as keyof T;
  }
  return defaultField;
}

/**
 * Elysia schema for paginated response
 * Use in route definition for OpenAPI documentation
 */
export function createPaginatedResponseSchema<T extends ReturnType<typeof t.Object>>(
  itemSchema: T
) {
  return t.Object({
    success: t.Literal(true),
    statusCode: t.Number(),
    data: t.Array(itemSchema),
    meta: t.Object({
      total: t.Number({ description: 'Total number of items' }),
      page: t.Number({ description: 'Current page number' }),
      limit: t.Number({ description: 'Items per page' }),
      totalPages: t.Number({ description: 'Total number of pages' }),
      hasNext: t.Boolean({ description: 'Whether there are more pages after current' }),
      hasPrev: t.Boolean({ description: 'Whether there are pages before current' }),
    }),
  });
}

/**
 * Pagination helper for repositories
 * Provides consistent pagination interface for data access
 */
export interface PaginatedQuery<TFilters = Record<string, unknown>> {
  pagination: PaginationParams;
  filters?: TFilters;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

/**
 * Generic paginated repository interface
 * Implement this in repositories that support pagination
 */
export interface IPaginatedRepository<T, TFilters = Record<string, unknown>> {
  findPaginated(query: PaginatedQuery<TFilters>): Promise<PaginatedResult<T>>;
}
