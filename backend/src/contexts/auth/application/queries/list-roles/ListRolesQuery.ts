import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * ListRolesQuery
 * Query to list all roles with optional pagination
 */
export class ListRolesQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly includePermissions: boolean = false,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
