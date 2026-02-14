import type { IPermissionService } from '../../domain/services/IPermissionService.ts';
import type { IPermissionRepository } from '../../domain/repositories/IPermissionRepository.ts';
import type { IRoleRepository } from '../../domain/repositories/IRoleRepository.ts';
import type { UserId } from '../../domain/value-objects/UserId.ts';
import { Permission } from '../../domain/value-objects/Permission.ts';

/**
 * PermissionService
 * Implements IPermissionService to calculate and check effective permissions
 *
 * Effective permissions = Role permissions + Individual permissions
 *
 * This service combines permissions from:
 * 1. All roles assigned to the user
 * 2. Individual permissions assigned directly to the user
 *
 * Supports wildcard matching (e.g., users:* grants users:read)
 */
export class PermissionService implements IPermissionService {
  constructor(
    private permissionRepository: IPermissionRepository,
    private roleRepository: IRoleRepository
  ) {}

  /**
   * Get all effective permissions for a user
   * Combines permissions from all user's roles + individual permissions
   * Deduplicates the result
   */
  async getEffectivePermissions(userId: UserId): Promise<Permission[]> {
    // Get roles for the user
    const roles = await this.roleRepository.findByUserId(userId);

    // Get all role entities to get their IDs
    const rolePermissions: Permission[] = [];

    for (const role of roles) {
      // Find the role entity by name to get the ID
      const roleEntity = await this.roleRepository.findByName(role.getValue());
      if (roleEntity) {
        const perms =
          await this.roleRepository.findPermissionsByRoleId(roleEntity.id);
        rolePermissions.push(...perms);
      }
    }

    // Get individual permissions for the user
    const individualPermissions =
      await this.permissionRepository.findByUserId(userId);

    // Combine and deduplicate
    const allPermissions = [...rolePermissions, ...individualPermissions];
    const uniquePermissions = this.deduplicatePermissions(allPermissions);

    return uniquePermissions;
  }

  /**
   * Get effective permission names as strings
   * Useful for API responses
   */
  async getEffectivePermissionNames(userId: UserId): Promise<string[]> {
    const permissions = await this.getEffectivePermissions(userId);
    return permissions.map((p) => p.getValue());
  }

  /**
   * Check if a user has a specific permission
   * Checks both role permissions and individual permissions
   * Supports wildcard matching (e.g., users:* grants users:read)
   */
  async userHasPermission(
    userId: UserId,
    permissionName: string
  ): Promise<boolean> {
    // Parse the requested permission
    const requestedResult = Permission.create(permissionName);
    if (!requestedResult.isOk) {
      return false;
    }
    const requested = requestedResult.getValue();

    // Get all effective permissions
    const effectivePermissions = await this.getEffectivePermissions(userId);

    // Check if any permission grants the requested permission
    return effectivePermissions.some((p) => p.grants(requested));
  }

  /**
   * Check if a user has any of the specified permissions
   */
  async userHasAnyPermission(
    userId: UserId,
    permissions: string[]
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.userHasPermission(userId, permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a user has all of the specified permissions
   */
  async userHasAllPermissions(
    userId: UserId,
    permissions: string[]
  ): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.userHasPermission(userId, permission))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Clear cached permissions for a user (if caching is implemented)
   * Should be called when user's roles or permissions change
   *
   * Note: Current implementation does not cache, but this method
   * provides a hook for future caching implementations
   */
  async invalidateUserPermissions(_userId: UserId): Promise<void> {
    // No-op for now - caching can be implemented later
    // When implementing, consider using Redis or in-memory cache
    // with a TTL that balances performance vs. permission freshness
  }

  /**
   * Deduplicates permissions based on their string representation
   */
  private deduplicatePermissions(permissions: Permission[]): Permission[] {
    const seen = new Set<string>();
    const unique: Permission[] = [];

    for (const permission of permissions) {
      const key = permission.getValue();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(permission);
      }
    }

    return unique;
  }
}
