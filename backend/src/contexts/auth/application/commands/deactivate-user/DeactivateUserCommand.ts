import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * DeactivateUserCommand
 * Command for admin to deactivate (soft delete) a user
 * Prevents the user from logging in but preserves their data
 */
export class DeactivateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly deactivatedByUserId: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
