import type { Role } from '../value-objects/Role.ts';
import type { RoleId } from '../value-objects/RoleId.ts';
import type { UserId } from '../value-objects/UserId.ts';
import type { Permission } from '../value-objects/Permission.ts';
import type { PermissionId } from '../value-objects/PermissionId.ts';

/**
 * Role entity for repository operations
 * Represents a role as stored in the database
 */
export interface RoleEntity {
  id: RoleId;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

/**
 * Paginated result for role queries
 */
export interface PaginatedRoles {
  roles: RoleEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Role Repository Interface
 * Defines the contract for role persistence operations
 * Domain layer does not know about implementation details (SQL, ORM, etc.)
 */
export interface IRoleRepository {
  /**
   * Find a role by its ID
   */
  findById(id: RoleId): Promise<RoleEntity | null>;

  /**
   * Find a role by its name
   */
  findByName(name: string): Promise<RoleEntity | null>;

  /**
   * Get all available roles in the system
   */
  findAll(): Promise<RoleEntity[]>;

  /**
   * Get all roles with pagination
   */
  findAllPaginated(page: number, limit: number): Promise<PaginatedRoles>;

  /**
   * Get all roles assigned to a user
   */
  findByUserId(userId: UserId): Promise<Role[]>;

  /**
   * Assign a role to a user
   */
  assignRoleToUser(
    userId: UserId,
    roleId: RoleId,
    assignedBy?: UserId
  ): Promise<void>;

  /**
   * Remove a role from a user
   */
  removeRoleFromUser(userId: UserId, roleId: RoleId): Promise<void>;

  /**
   * Check if a user has a specific role
   */
  userHasRole(userId: UserId, roleName: string): Promise<boolean>;

  /**
   * Save a new role to the database
   */
  save(role: RoleEntity): Promise<void>;

  /**
   * Update an existing role
   */
  update(role: RoleEntity): Promise<void>;

  /**
   * Delete a role by its ID
   * @throws Error if role is a system role
   */
  delete(id: RoleId): Promise<void>;

  /**
   * Check if a role exists by its name
   */
  existsByName(name: string): Promise<boolean>;

  // ========== Role-Permission Management ==========

  /**
   * Get all permissions assigned to a role
   */
  findPermissionsByRoleId(roleId: RoleId): Promise<Permission[]>;

  /**
   * Assign a permission to a role
   */
  assignPermissionToRole(
    roleId: RoleId,
    permissionId: PermissionId,
    assignedBy?: UserId
  ): Promise<void>;

  /**
   * Remove a permission from a role
   */
  removePermissionFromRole(roleId: RoleId, permissionId: PermissionId): Promise<void>;

  /**
   * Check if a role has a specific permission
   */
  roleHasPermission(roleId: RoleId, permissionName: string): Promise<boolean>;

  /**
   * Set all permissions for a role (replace existing)
   */
  setRolePermissions(
    roleId: RoleId,
    permissionIds: PermissionId[],
    assignedBy?: UserId
  ): Promise<void>;
}
