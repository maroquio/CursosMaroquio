import { ValueObject } from '@shared/domain/ValueObject.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode, getErrorMessage } from '@shared/domain/errors/ErrorCodes.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { ROLE_NAME_REGEX } from '@shared/constants/validation.ts';

/**
 * System role constants
 * These are the default roles created on application startup
 * Only 'admin' is protected (cannot be deleted)
 */
export const SystemRoles = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

interface RoleProps {
  name: string;
}

/**
 * Role Value Object
 * Represents a system role with validation
 *
 * Supports dynamic roles - any valid role name is accepted
 * Role names must:
 * - Start with a letter
 * - Contain only lowercase letters, numbers, and underscores
 * - Be at least 2 characters long
 *
 * Immutable - role names cannot be changed after creation
 *
 * @example
 * ```typescript
 * // Without i18n
 * const role = Role.create('manager');
 *
 * // With i18n
 * const role = Role.create('manager', ctx.t);
 * // Error: "O nome do papel deve ter pelo menos 2 caracteres" (pt-BR)
 * ```
 */
export class Role extends ValueObject<RoleProps> {
  private constructor(name: string) {
    super({ name });
  }

  /**
   * Create a new Role from a string
   * Validates the role name format (allows any valid name, not just predefined roles)
   *
   * @param name - The role name to validate
   * @param t - Optional translation functions for localized error messages
   */
  public static create(name: string, t?: TranslationFunctions): Result<Role> {
    if (!name || name.trim().length === 0) {
      return Result.fail(
        t ? t.auth.role.nameRequired() : getErrorMessage(ErrorCode.ROLE_NAME_REQUIRED)
      );
    }

    const normalizedName = name.toLowerCase().trim();

    if (normalizedName.length < 2) {
      return Result.fail(
        t ? t.auth.role.nameTooShort({ minLength: 2 }) : getErrorMessage(ErrorCode.ROLE_NAME_TOO_SHORT)
      );
    }

    if (normalizedName.length > 50) {
      return Result.fail(
        t ? t.auth.role.nameTooLong({ maxLength: 50 }) : getErrorMessage(ErrorCode.ROLE_NAME_TOO_LONG)
      );
    }

    // Validate format: lowercase alphanumeric with underscores, starting with letter
    if (!ROLE_NAME_REGEX.test(normalizedName)) {
      return Result.fail(
        t ? t.auth.role.invalidFormat() : getErrorMessage(ErrorCode.ROLE_NAME_INVALID_FORMAT)
      );
    }

    return Result.ok(new Role(normalizedName));
  }

  /**
   * Create an admin role
   * Factory method for convenience
   */
  public static admin(): Role {
    return new Role(SystemRoles.ADMIN);
  }

  /**
   * Create a user role
   * Factory method for convenience
   */
  public static user(): Role {
    return new Role(SystemRoles.USER);
  }

  /**
   * Get the role name as a string
   */
  public getValue(): string {
    return this.props.name;
  }

  /**
   * Check if this is an admin role
   */
  public isAdmin(): boolean {
    return this.props.name === SystemRoles.ADMIN;
  }

  /**
   * Check if this is a user role
   */
  public isUser(): boolean {
    return this.props.name === SystemRoles.USER;
  }

  /**
   * Check if this is a system role (admin only is protected)
   */
  public isSystemRole(): boolean {
    return this.props.name === SystemRoles.ADMIN;
  }

  /**
   * Get the default system role names
   */
  public static getSystemRoles(): string[] {
    return Object.values(SystemRoles);
  }

  /**
   * Compare two roles for equality
   */
  public override equals(other: Role): boolean {
    return this.props.name === other.getValue();
  }
}
