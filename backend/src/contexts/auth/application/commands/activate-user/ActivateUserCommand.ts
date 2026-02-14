import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * ActivateUserCommand
 * Command for admin to reactivate a previously deactivated user
 */
export class ActivateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly activatedByUserId: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
