import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * AssignPermissionToUserCommand
 * Command to assign a permission directly to a user (not through a role)
 *
 * @example
 * ```typescript
 * // Without i18n (backward compatible)
 * const command = new AssignPermissionToUserCommand(targetUserId, permissionName, assignerUserId);
 *
 * // With i18n
 * const command = new AssignPermissionToUserCommand(targetUserId, permissionName, assignerUserId, ctx.t);
 * ```
 */
export class AssignPermissionToUserCommand {
  constructor(
    public readonly targetUserId: string,
    public readonly permissionName: string,
    public readonly assignedByUserId: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
