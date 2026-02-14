import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * CreatePermissionCommand
 * Command to create a new permission in the system
 *
 * @example
 * ```typescript
 * // Without i18n (backward compatible)
 * const command = new CreatePermissionCommand(name, description, userId);
 *
 * // With i18n
 * const command = new CreatePermissionCommand(name, description, userId, ctx.t);
 * ```
 */
export class CreatePermissionCommand {
  constructor(
    public readonly name: string,
    public readonly description: string | null,
    public readonly createdByUserId: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
