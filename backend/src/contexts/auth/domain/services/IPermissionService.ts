import type { UserId } from '../value-objects/UserId.ts';
import type { Permission } from '../value-objects/Permission.ts';

/**
 * Permission Service Interface
 * Provides methods for checking effective permissions of a user
 *
 * Effective permissions = role permissions + individual permissions
 */
export interface IPermissionService {
  /**
   * Get all effective permissions for a user
   * Combines permissions from all user's roles + individual permissions
   * Deduplicates the result
   */
  getEffectivePermissions(userId: UserId): Promise<Permission[]>;

  /**
   * Get effective permission names as strings
   * Useful for API responses
   */
  getEffectivePermissionNames(userId: UserId): Promise<string[]>;

  /**
   * Check if a user has a specific permission
   * Checks both role permissions and individual permissions
   * Supports wildcard matching (e.g., users:* grants users:read)
   */
  userHasPermission(userId: UserId, permission: string): Promise<boolean>;

  /**
   * Check if a user has any of the specified permissions
   */
  userHasAnyPermission(userId: UserId, permissions: string[]): Promise<boolean>;

  /**
   * Check if a user has all of the specified permissions
   */
  userHasAllPermissions(userId: UserId, permissions: string[]): Promise<boolean>;

  /**
   * Clear cached permissions for a user (if caching is implemented)
   * Should be called when user's roles or permissions change
   */
  invalidateUserPermissions(userId: UserId): Promise<void>;
}
