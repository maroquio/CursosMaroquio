import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * AssignPermissionToRoleCommand
 * Command to assign a permission to a role
 *
 * @example
 * ```typescript
 * // Without i18n (backward compatible)
 * const command = new AssignPermissionToRoleCommand(roleId, permissionName, assignerUserId);
 *
 * // With i18n
 * const command = new AssignPermissionToRoleCommand(roleId, permissionName, assignerUserId, ctx.t);
 * ```
 */
export class AssignPermissionToRoleCommand {
  constructor(
    public readonly roleId: string,
    public readonly permissionName: string,
    public readonly assignedByUserId: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
