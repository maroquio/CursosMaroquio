import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * UpdateUserAdminCommand
 * Command for admin to update user details
 * Email can be updated (with uniqueness check)
 */
export class UpdateUserAdminCommand {
  constructor(
    public readonly userId: string,
    public readonly updatedByUserId: string,
    public readonly email?: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
