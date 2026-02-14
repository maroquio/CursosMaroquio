import { ValueObject } from '@shared/domain/ValueObject.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { PERMISSION_SEGMENT_REGEX } from '@shared/constants/validation.ts';

interface PermissionProps {
  resource: string;
  action: string;
}

/**
 * Permission Value Object
 * Represents a granular permission in format resource:action
 *
 * Examples:
 * - users:read - Read users
 * - users:create - Create users
 * - roles:* - All actions on roles (wildcard)
 *
 * Immutable - permission names cannot be changed after creation
 */
export class Permission extends ValueObject<PermissionProps> {
  private constructor(resource: string, action: string) {
    super({ resource, action });
  }

  /**
   * Create a Permission from a string in format "resource:action"
   * @param permission - The permission string (e.g., "users:read")
   */
  public static create(permission: string): Result<Permission> {
    if (!permission || permission.trim().length === 0) {
      return Result.fail(ErrorCode.PERMISSION_EMPTY);
    }

    const parts = permission.split(':');
    if (parts.length !== 2) {
      return Result.fail(ErrorCode.PERMISSION_INVALID_FORMAT);
    }

    const [resource, action] = parts;

    if (!resource || resource.trim().length === 0) {
      return Result.fail(ErrorCode.PERMISSION_RESOURCE_EMPTY);
    }

    if (!action || action.trim().length === 0) {
      return Result.fail(ErrorCode.PERMISSION_ACTION_EMPTY);
    }

    const normalizedResource = resource.toLowerCase().trim();
    const normalizedAction = action.toLowerCase().trim();

    // Validate resource format: lowercase alphanumeric with underscores, starting with letter
    if (!PERMISSION_SEGMENT_REGEX.test(normalizedResource)) {
      return Result.fail(ErrorCode.PERMISSION_RESOURCE_INVALID_FORMAT);
    }

    // Validate action format: same as resource, OR wildcard '*'
    if (normalizedAction !== '*' && !PERMISSION_SEGMENT_REGEX.test(normalizedAction)) {
      return Result.fail(ErrorCode.PERMISSION_ACTION_INVALID_FORMAT);
    }

    return Result.ok(new Permission(normalizedResource, normalizedAction));
  }

  /**
   * Create a Permission from separate resource and action
   */
  public static createFromParts(resource: string, action: string): Result<Permission> {
    return Permission.create(`${resource}:${action}`);
  }

  /**
   * Get the resource part of the permission
   */
  public getResource(): string {
    return this.props.resource;
  }

  /**
   * Get the action part of the permission
   */
  public getAction(): string {
    return this.props.action;
  }

  /**
   * Get the full permission string (resource:action)
   */
  public getValue(): string {
    return `${this.props.resource}:${this.props.action}`;
  }

  /**
   * Check if this permission uses a wildcard action
   */
  public isWildcard(): boolean {
    return this.props.action === '*';
  }

  /**
   * Check if this permission matches another permission
   * Supports wildcard matching: users:* matches users:read, users:create, etc.
   * @param other - The permission to match against
   */
  public matches(other: Permission): boolean {
    // Resources must match exactly
    if (this.props.resource !== other.getResource()) {
      return false;
    }

    // If this permission is a wildcard, it matches any action
    if (this.isWildcard()) {
      return true;
    }

    // If the other permission is a wildcard, it also matches
    if (other.isWildcard()) {
      return true;
    }

    // Actions must match exactly
    return this.props.action === other.getAction();
  }

  /**
   * Check if this permission grants the requested permission
   * Similar to matches(), but only considers this permission as the "grant"
   * @param requested - The permission being requested
   */
  public grants(requested: Permission): boolean {
    // Resources must match exactly
    if (this.props.resource !== requested.getResource()) {
      return false;
    }

    // If this permission is a wildcard, it grants any action
    if (this.isWildcard()) {
      return true;
    }

    // Actions must match exactly
    return this.props.action === requested.getAction();
  }

  /**
   * Compare two permissions for equality
   */
  public override equals(other: Permission): boolean {
    return (
      this.props.resource === other.getResource() &&
      this.props.action === other.getAction()
    );
  }
}
