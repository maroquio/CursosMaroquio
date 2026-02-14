/**
 * HTTP Infrastructure exports
 */
export {
  // Types
  type PaginationParams,
  type PaginationMeta,
  type PaginatedResponse,
  type SortOrder,
  type AllowedSortFields,
  type PaginatedQuery,
  type PaginatedResult,
  type IPaginatedRepository,

  // Constants
  PaginationDefaults,
  PaginationQuerySchema,

  // Functions
  parsePaginationParams,
  calculatePaginationMeta,
  calculateOffset,
  createPaginatedResponse,
  validateSortField,
  createPaginatedResponseSchema,
} from './Pagination.ts';

export {
  // Types
  type ApiVersionConfig,
  type VersionedRouteRegistrar,
  type VersionedResponse,

  // Constants
  API_VERSIONS,
  CURRENT_API_VERSION,

  // Functions
  versionedPath,
  createDeprecationHeaders,
  createVersionMiddleware,
  createVersionedGroup,
  createPathBuilder,
  createVersionedResponse,
} from './ApiVersion.ts';
