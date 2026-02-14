import type { Permission } from '../value-objects/Permission.ts';
import type { PermissionId } from '../value-objects/PermissionId.ts';
import type { UserId } from '../value-objects/UserId.ts';
import type { RoleId } from '../value-objects/RoleId.ts';

/**
 * Permission entity for repository operations
 * Represents a permission as stored in the database
 */
export interface PermissionEntity {
  id: PermissionId;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  createdAt: Date;
}

/**
 * Paginated result for permission queries
 */
export interface PaginatedPermissions {
  permissions: PermissionEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Permission Repository Interface
 * Defines the contract for permission persistence operations
 * Domain layer does not know about implementation details (SQL, ORM, etc.)
 */
export interface IPermissionRepository {
  // ========== Basic CRUD ==========

  /**
   * Find a permission by its ID
   */
  findById(id: PermissionId): Promise<PermissionEntity | null>;

  /**
   * Find a permission by its name (resource:action)
   */
  findByName(name: string): Promise<PermissionEntity | null>;

  /**
   * Find all permissions for a specific resource
   */
  findByResource(resource: string): Promise<PermissionEntity[]>;

  /**
   * Get all permissions in the system
   */
  findAll(): Promise<PermissionEntity[]>;

  /**
   * Get all permissions with pagination
   */
  findAllPaginated(page: number, limit: number): Promise<PaginatedPermissions>;

  /**
   * Save a new permission
   */
  save(permission: PermissionEntity): Promise<void>;

  /**
   * Update an existing permission
   */
  update(permission: PermissionEntity): Promise<void>;

  /**
   * Delete a permission by its ID
   */
  delete(id: PermissionId): Promise<void>;

  /**
   * Check if a permission exists by its name
   */
  existsByName(name: string): Promise<boolean>;

  // ========== User-Permission Operations ==========

  /**
   * Get all individual permissions assigned directly to a user
   * (not inherited from roles)
   */
  findByUserId(userId: UserId): Promise<Permission[]>;

  /**
   * Assign an individual permission to a user
   */
  assignToUser(
    permissionId: PermissionId,
    userId: UserId,
    assignedBy?: UserId
  ): Promise<void>;

  /**
   * Remove an individual permission from a user
   */
  removeFromUser(permissionId: PermissionId, userId: UserId): Promise<void>;

  /**
   * Check if a user has a specific individual permission
   */
  userHasPermission(userId: UserId, permissionName: string): Promise<boolean>;

  /**
   * Set all individual permissions for a user (replace existing)
   */
  setUserPermissions(
    userId: UserId,
    permissionIds: PermissionId[],
    assignedBy?: UserId
  ): Promise<void>;

  // ========== Role-Permission Queries ==========

  /**
   * Get all permissions assigned to a role
   */
  findByRoleId(roleId: RoleId): Promise<Permission[]>;

  // ========== Bulk Operations ==========

  /**
   * Find multiple permissions by their IDs
   */
  findByIds(ids: PermissionId[]): Promise<PermissionEntity[]>;

  /**
   * Find multiple permissions by their names
   */
  findByNames(names: string[]): Promise<PermissionEntity[]>;
}
