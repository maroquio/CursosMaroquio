import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * UpdateRoleCommand
 * Command to update an existing role
 *
 * @example
 * ```typescript
 * const command = new UpdateRoleCommand(roleId, name, description, userId, ctx.t);
 * ```
 */
export class UpdateRoleCommand {
  constructor(
    public readonly roleId: string,
    public readonly name: string | null,
    public readonly description: string | null,
    public readonly updatedByUserId: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
