/**
 * PermissionReadDto
 * Read model for permission queries
 */
export interface PermissionReadDto {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  createdAt: string;
}

/**
 * PaginatedPermissionsDto
 * Paginated response for permission listing
 */
export interface PaginatedPermissionsDto {
  permissions: PermissionReadDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
