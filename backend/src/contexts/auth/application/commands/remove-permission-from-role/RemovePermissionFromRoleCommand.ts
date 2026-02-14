import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * RemovePermissionFromRoleCommand
 * Command to remove a permission from a role
 *
 * @example
 * ```typescript
 * // Without i18n (backward compatible)
 * const command = new RemovePermissionFromRoleCommand(roleId, permissionName, removerUserId);
 *
 * // With i18n
 * const command = new RemovePermissionFromRoleCommand(roleId, permissionName, removerUserId, ctx.t);
 * ```
 */
export class RemovePermissionFromRoleCommand {
  constructor(
    public readonly roleId: string,
    public readonly permissionName: string,
    public readonly removedByUserId: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
