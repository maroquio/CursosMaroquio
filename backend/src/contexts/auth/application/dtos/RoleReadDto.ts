/**
 * RoleReadDto
 * Read model for role queries
 */
export interface RoleReadDto {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string | null;
  permissions?: string[];
}

/**
 * PaginatedRolesDto
 * Paginated response for role listing
 */
export interface PaginatedRolesDto {
  roles: RoleReadDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
