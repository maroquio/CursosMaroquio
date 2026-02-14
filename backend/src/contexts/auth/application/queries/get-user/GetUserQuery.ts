import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * GetUserQuery
 * Represents the intent to retrieve a user by ID
 * Read-only operation that does not modify system state
 */
export class GetUserQuery {
  constructor(
    public readonly userId: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
