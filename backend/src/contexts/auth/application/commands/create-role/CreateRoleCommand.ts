import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * CreateRoleCommand
 * Command to create a new role in the system
 *
 * @example
 * ```typescript
 * // Without i18n (backward compatible)
 * const command = new CreateRoleCommand(name, description, userId);
 *
 * // With i18n
 * const command = new CreateRoleCommand(name, description, userId, ctx.t);
 * ```
 */
export class CreateRoleCommand {
  constructor(
    public readonly name: string,
    public readonly description: string | null,
    public readonly createdByUserId: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
