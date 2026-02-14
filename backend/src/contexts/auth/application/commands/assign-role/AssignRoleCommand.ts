import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * AssignRoleCommand
 * Command to assign a role to a user
 *
 * @example
 * ```typescript
 * const command = new AssignRoleCommand(targetUserId, roleName, assignedByUserId, ctx.t);
 * ```
 */
export class AssignRoleCommand {
  constructor(
    public readonly targetUserId: string,
    public readonly roleName: string,
    public readonly assignedByUserId: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
