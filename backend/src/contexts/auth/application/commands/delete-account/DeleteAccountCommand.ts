import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * DeleteAccountCommand
 * Command for a user to delete (deactivate) their own account
 * Requires password verification for security
 */
export class DeleteAccountCommand {
  constructor(
    public readonly userId: string,
    public readonly password: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
