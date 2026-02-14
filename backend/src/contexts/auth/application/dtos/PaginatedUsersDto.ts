import type { UserAdminReadDto } from './UserAdminReadDto.ts';

/**
 * PaginatedUsersDto (Paginated Read Model)
 * Data Transfer Object for paginated user listings
 * Used by list endpoints with pagination support
 */
export interface PaginatedUsersDto {
  users: UserAdminReadDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
