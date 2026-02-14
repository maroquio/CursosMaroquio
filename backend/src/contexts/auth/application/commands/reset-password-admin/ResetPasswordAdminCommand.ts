import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * ResetPasswordAdminCommand
 * Command for admin to reset a user's password
 * Sets a new password directly without requiring the old one
 */
export class ResetPasswordAdminCommand {
  constructor(
    public readonly userId: string,
    public readonly newPassword: string,
    public readonly resetByUserId: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
