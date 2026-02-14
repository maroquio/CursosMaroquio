import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * DeleteRoleCommand
 * Command to delete a role from the system
 *
 * @example
 * ```typescript
 * // Without i18n (backward compatible)
 * const command = new DeleteRoleCommand(roleId, userId);
 *
 * // With i18n
 * const command = new DeleteRoleCommand(roleId, userId, ctx.t);
 * ```
 */
export class DeleteRoleCommand {
  constructor(
    public readonly roleId: string,
    public readonly deletedByUserId: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
