/**
 * UserAdminReadDto (Admin Read Model)
 * Data Transfer Object with full user details for admin operations
 * Includes roles, permissions, and active status
 * Should NOT be used for write operations
 */
export interface UserAdminReadDto {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  photoUrl: string | null;
  isActive: boolean;
  roles: string[];
  individualPermissions: string[];
  createdAt: string; // ISO 8601 format
}
