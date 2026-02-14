import { Result } from '@shared/domain/Result.ts';
import { AuthProvider } from '../value-objects/AuthProvider.ts';
import { OAuthProfile } from '../value-objects/OAuthProfile.ts';

/**
 * OAuth tokens returned after authorization code exchange
 */
export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  idToken?: string | null; // For OpenID Connect providers (Google, Apple)
}

/**
 * Full OAuth result including profile and tokens
 */
export interface OAuthResult {
  profile: OAuthProfile;
  tokens: OAuthTokens;
}

/**
 * OAuth Service Interface
 * Defines the contract for OAuth provider interactions
 * Domain layer does not know about implementation details (Arctic, HTTP, etc.)
 */
export interface IOAuthService {
  /**
   * Check if a provider is enabled (credentials configured)
   */
  isProviderEnabled(provider: AuthProvider): boolean;

  /**
   * Get the list of enabled OAuth providers
   */
  getEnabledProviders(): AuthProvider[];

  /**
   * Generate the authorization URL for a provider
   * The user will be redirected to this URL to authenticate
   *
   * @param provider The OAuth provider
   * @param state A random state for CSRF protection (stored in cookie/session)
   * @param codeVerifier Optional PKCE code verifier (for providers that support it)
   * @returns The authorization URL to redirect the user to
   */
  getAuthorizationUrl(provider: AuthProvider, state: string, codeVerifier?: string): Promise<Result<string>>;

  /**
   * Exchange an authorization code for tokens and fetch the user profile
   *
   * @param provider The OAuth provider
   * @param code The authorization code from the callback
   * @param codeVerifier Optional PKCE code verifier (must match the one used in authorization)
   * @returns The OAuth result containing profile and tokens
   */
  exchangeCodeForTokens(provider: AuthProvider, code: string, codeVerifier?: string): Promise<Result<OAuthResult>>;

  /**
   * Refresh an access token using a refresh token
   * Not all providers support this
   *
   * @param provider The OAuth provider
   * @param refreshToken The refresh token
   * @returns New OAuth tokens
   */
  refreshAccessToken(provider: AuthProvider, refreshToken: string): Promise<Result<OAuthTokens>>;

  /**
   * Revoke tokens for a provider
   * Call this when unlinking an OAuth account
   *
   * @param provider The OAuth provider
   * @param accessToken The access token to revoke
   */
  revokeToken(provider: AuthProvider, accessToken: string): Promise<Result<void>>;
}
