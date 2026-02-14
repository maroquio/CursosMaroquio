import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * GetUserPermissionsQuery
 * Query to get all effective permissions for a user
 * (combines role permissions + individual permissions)
 */
export class GetUserPermissionsQuery {
  constructor(
    public readonly userId: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
