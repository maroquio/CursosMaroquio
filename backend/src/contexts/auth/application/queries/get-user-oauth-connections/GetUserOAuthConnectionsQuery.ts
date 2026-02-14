import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * GetUserOAuthConnectionsQuery
 * Represents the intent to retrieve all OAuth connections for a user
 * Read-only operation to list linked social accounts
 */
export class GetUserOAuthConnectionsQuery {
  constructor(
    /** The authenticated user's ID */
    public readonly userId: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
