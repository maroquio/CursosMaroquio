import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * RemoveRoleCommand
 * Command to remove a role from a user
 *
 * @example
 * ```typescript
 * const command = new RemoveRoleCommand(targetUserId, roleName, removedByUserId, ctx.t);
 * ```
 */
export class RemoveRoleCommand {
  constructor(
    public readonly targetUserId: string,
    public readonly roleName: string,
    public readonly removedByUserId: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
