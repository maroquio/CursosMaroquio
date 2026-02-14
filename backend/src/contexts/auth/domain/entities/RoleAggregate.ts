import { Entity } from '@shared/domain/Entity.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { ROLE_NAME_REGEX } from '@shared/constants/validation.ts';
import { RoleId } from '../value-objects/RoleId.ts';
import { Permission } from '../value-objects/Permission.ts';
import { UserId } from '../value-objects/UserId.ts';
import { SystemRoles } from '../value-objects/Role.ts';

/**
 * Role Aggregate Root
 * Represents a role in the system with associated permissions
 *
 * Only the 'admin' role is a system role (protected from deletion)
 * All other roles are configurable by admin
 */
export class RoleAggregate extends Entity<RoleId> {
  private constructor(
    id: RoleId,
    private name: string,
    private description: string | null,
    private isSystem: boolean,
    private permissions: Permission[],
    private createdAt: Date,
    private updatedAt: Date | null
  ) {
    super(id);
  }

  /**
   * Create a new role
   * System roles cannot be created via this method
   */
  public static create(
    name: string,
    description: string | null = null
  ): Result<RoleAggregate> {
    // Validate name format
    if (!name || name.trim().length === 0) {
      return Result.fail(ErrorCode.ROLE_NAME_REQUIRED);
    }

    const normalizedName = name.toLowerCase().trim();

    if (normalizedName.length < 2) {
      return Result.fail(ErrorCode.ROLE_NAME_TOO_SHORT);
    }

    if (normalizedName.length > 50) {
      return Result.fail(ErrorCode.ROLE_NAME_TOO_LONG);
    }

    if (!ROLE_NAME_REGEX.test(normalizedName)) {
      return Result.fail(ErrorCode.ROLE_NAME_INVALID_FORMAT);
    }

    // Check if trying to create a system role
    if (normalizedName === SystemRoles.ADMIN) {
      return Result.fail(ErrorCode.ROLE_RESERVED_NAME);
    }

    const role = new RoleAggregate(
      RoleId.create(),
      normalizedName,
      description,
      false, // Non-system roles
      [],
      new Date(),
      null
    );

    return Result.ok(role);
  }

  /**
   * Create a system role (admin only)
   * Used during seed/initialization
   */
  public static createSystemRole(
    name: string,
    description: string | null = null
  ): Result<RoleAggregate> {
    const normalizedName = name.toLowerCase().trim();

    if (normalizedName !== SystemRoles.ADMIN) {
      return Result.fail(ErrorCode.ROLE_ONLY_ADMIN_SYSTEM);
    }

    const role = new RoleAggregate(
      RoleId.create(),
      normalizedName,
      description,
      true, // System role
      [],
      new Date(),
      null
    );

    return Result.ok(role);
  }

  /**
   * Reconstruct a role from persistence
   */
  public static reconstruct(
    id: RoleId,
    name: string,
    description: string | null,
    isSystem: boolean,
    permissions: Permission[],
    createdAt: Date,
    updatedAt: Date | null
  ): RoleAggregate {
    return new RoleAggregate(
      id,
      name,
      description,
      isSystem,
      permissions,
      createdAt,
      updatedAt
    );
  }

  // ========== Getters ==========

  public getName(): string {
    return this.name;
  }

  public getDescription(): string | null {
    return this.description;
  }

  public getIsSystem(): boolean {
    return this.isSystem;
  }

  public getPermissions(): Permission[] {
    return [...this.permissions];
  }

  public getPermissionNames(): string[] {
    return this.permissions.map((p) => p.getValue());
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date | null {
    return this.updatedAt;
  }

  // ========== Update Methods ==========

  /**
   * Update role details
   * System roles cannot be renamed
   */
  public updateDetails(
    name?: string,
    description?: string | null
  ): Result<void> {
    if (name !== undefined) {
      if (this.isSystem && name.toLowerCase() !== this.name) {
        return Result.fail(ErrorCode.ROLE_CANNOT_RENAME_SYSTEM);
      }

      const normalizedName = name.toLowerCase().trim();

      if (normalizedName.length < 2) {
        return Result.fail(ErrorCode.ROLE_NAME_TOO_SHORT);
      }

      if (normalizedName.length > 50) {
        return Result.fail(ErrorCode.ROLE_NAME_TOO_LONG);
      }

      if (!ROLE_NAME_REGEX.test(normalizedName)) {
        return Result.fail(ErrorCode.ROLE_NAME_INVALID_FORMAT);
      }

      // Prevent renaming to reserved name
      if (normalizedName === SystemRoles.ADMIN && this.name !== SystemRoles.ADMIN) {
        return Result.fail(ErrorCode.ROLE_CANNOT_RENAME_TO_ADMIN);
      }

      this.name = normalizedName;
    }

    if (description !== undefined) {
      this.description = description;
    }

    this.updatedAt = new Date();
    return Result.ok<void>(undefined);
  }

  // ========== Permission Management ==========

  /**
   * Check if role has a specific permission
   */
  public hasPermission(permission: Permission | string): boolean {
    const permName = typeof permission === 'string' ? permission : permission.getValue();
    return this.permissions.some((p) => p.getValue() === permName);
  }

  /**
   * Check if role has a permission that grants the requested permission
   * Supports wildcard matching
   */
  public grantsPermission(permission: Permission): boolean {
    return this.permissions.some((p) => p.grants(permission));
  }

  /**
   * Add a permission to this role
   */
  public addPermission(permission: Permission, _assignedBy?: UserId): Result<void> {
    if (this.hasPermission(permission)) {
      return Result.fail(ErrorCode.ROLE_ALREADY_HAS_PERMISSION);
    }

    this.permissions.push(permission);
    this.updatedAt = new Date();
    return Result.ok<void>(undefined);
  }

  /**
   * Remove a permission from this role
   */
  public removePermission(permission: Permission): Result<void> {
    const index = this.permissions.findIndex(
      (p) => p.getValue() === permission.getValue()
    );

    if (index === -1) {
      return Result.fail(ErrorCode.ROLE_DOES_NOT_HAVE_PERMISSION);
    }

    this.permissions.splice(index, 1);
    this.updatedAt = new Date();
    return Result.ok<void>(undefined);
  }

  /**
   * Replace all permissions with a new set
   */
  public setPermissions(permissions: Permission[]): void {
    this.permissions = [...permissions];
    this.updatedAt = new Date();
  }

  // ========== Validation ==========

  /**
   * Check if this role can be deleted
   * System roles (admin) cannot be deleted
   */
  public canDelete(): boolean {
    return !this.isSystem;
  }

  /**
   * Check if this is the admin role
   */
  public isAdminRole(): boolean {
    return this.name === SystemRoles.ADMIN;
  }
}
