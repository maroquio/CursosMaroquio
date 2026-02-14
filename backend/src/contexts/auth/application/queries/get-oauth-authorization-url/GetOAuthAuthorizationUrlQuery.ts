import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * GetOAuthAuthorizationUrlQuery
 * Represents the intent to get an OAuth authorization URL for a provider
 * Read-only operation that generates URLs for OAuth flow initiation
 */
export class GetOAuthAuthorizationUrlQuery {
  constructor(
    /** The OAuth provider (google, facebook, apple) */
    public readonly provider: string,

    /** Optional state parameter for CSRF protection */
    public readonly state?: string,

    /** Optional PKCE code verifier (for providers that support it) */
    public readonly codeVerifier?: string,

    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
