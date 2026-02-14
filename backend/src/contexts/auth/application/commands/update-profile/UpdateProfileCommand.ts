import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * UpdateProfileCommand
 * Command for a user to update their own profile information
 */
export class UpdateProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly fullName: string,
    public readonly phone?: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
