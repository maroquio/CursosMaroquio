import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * OAuth Login Command
 * Authenticates a user via OAuth provider callback
 *
 * This handles the OAuth callback after the user authorizes with the provider.
 * It either:
 * 1. Logs in an existing user (if OAuth connection exists)
 * 2. Creates a new user + OAuth connection (if first-time social login)
 * 3. Links OAuth to existing user by email (if email matches existing user)
 */
export interface OAuthLoginCommand {
  /** The OAuth provider (google, facebook, apple) */
  provider: string;

  /** The authorization code from the OAuth callback */
  code: string;

  /** The PKCE code verifier (for providers that support it) */
  codeVerifier?: string;

  /** User agent for refresh token tracking */
  userAgent?: string;

  /** IP address for refresh token tracking */
  ipAddress?: string;

  /** Optional translator for localized error messages */
  t?: TranslationFunctions;
}
