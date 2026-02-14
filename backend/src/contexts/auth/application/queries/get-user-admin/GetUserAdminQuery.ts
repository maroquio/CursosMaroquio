import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * GetUserAdminQuery
 * Query to retrieve a user with full admin details by ID
 * Returns complete user information including roles and permissions
 */
export class GetUserAdminQuery {
  constructor(
    public readonly userId: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
