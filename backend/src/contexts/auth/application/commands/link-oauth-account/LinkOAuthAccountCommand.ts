import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * Link OAuth Account Command
 * Links an OAuth provider to an existing authenticated user account
 *
 * This allows users to:
 * - Add social login to an account created with email/password
 * - Link multiple OAuth providers to one account
 */
export interface LinkOAuthAccountCommand {
  /** The authenticated user's ID */
  userId: string;

  /** The OAuth provider to link (google, facebook, apple) */
  provider: string;

  /** The authorization code from the OAuth callback */
  code: string;

  /** The PKCE code verifier (for providers that support it) */
  codeVerifier?: string;

  /** Optional translator for localized error messages */
  t?: TranslationFunctions;
}
