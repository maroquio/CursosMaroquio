import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * RemovePermissionFromUserCommand
 * Command to remove a permission from a user (individual permission, not from role)
 *
 * @example
 * ```typescript
 * // Without i18n (backward compatible)
 * const command = new RemovePermissionFromUserCommand(targetUserId, permissionName, removerUserId);
 *
 * // With i18n
 * const command = new RemovePermissionFromUserCommand(targetUserId, permissionName, removerUserId, ctx.t);
 * ```
 */
export class RemovePermissionFromUserCommand {
  constructor(
    public readonly targetUserId: string,
    public readonly permissionName: string,
    public readonly removedByUserId: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
