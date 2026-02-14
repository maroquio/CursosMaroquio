import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * ListPermissionsQuery
 * Query to list all permissions with optional pagination
 */
export class ListPermissionsQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly resource?: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
