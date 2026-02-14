import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * Unlink OAuth Account Command
 * Removes an OAuth provider from an authenticated user account
 *
 * Security: User must have at least one of:
 * - A password set (can still login with email/password)
 * - Another OAuth provider linked (can still login with that)
 */
export interface UnlinkOAuthAccountCommand {
  /** The authenticated user's ID */
  userId: string;

  /** The OAuth provider to unlink (google, facebook, apple) */
  provider: string;

  /** Optional translator for localized error messages */
  t?: TranslationFunctions;
}
