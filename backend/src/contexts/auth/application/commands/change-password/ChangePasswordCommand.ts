import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * ChangePasswordCommand
 * Command for a user to change their own password
 * Requires current password verification
 */
export class ChangePasswordCommand {
  constructor(
    public readonly userId: string,
    public readonly currentPassword: string,
    public readonly newPassword: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
