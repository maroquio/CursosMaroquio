import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode, getErrorMessage } from '@shared/domain/errors/ErrorCodes.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { AuthProvider } from '../../../domain/value-objects/AuthProvider.ts';
import type { IOAuthService } from '../../../domain/services/IOAuthService.ts';
import { GetOAuthAuthorizationUrlQuery } from './GetOAuthAuthorizationUrlQuery.ts';

/**
 * Response DTO for OAuth authorization URL
 */
export interface OAuthAuthorizationUrlDto {
  /** The URL to redirect the user to for OAuth authorization */
  authorizationUrl: string;

  /** The state parameter to verify in the callback */
  state: string;

  /** The PKCE code verifier (only for PKCE-enabled providers) */
  codeVerifier?: string;
}

/**
 * GetOAuthAuthorizationUrlHandler
 * Generates OAuth authorization URLs for the specified provider
 *
 * The frontend will:
 * 1. Call this endpoint to get the authorization URL
 * 2. Store the state (and codeVerifier if PKCE) in session/localStorage
 * 3. Redirect the user to the authorizationUrl
 * 4. After user authorizes, provider redirects back with code + state
 * 5. Frontend sends code + codeVerifier to callback endpoint
 */
export class GetOAuthAuthorizationUrlHandler
  implements IQueryHandler<GetOAuthAuthorizationUrlQuery, OAuthAuthorizationUrlDto>
{
  constructor(private oauthService: IOAuthService) {}

  /**
   * Get localized error message for unsupported provider
   */
  private getUnsupportedProviderError(t: TranslationFunctions | undefined, provider: string): string {
    return t
      ? t.auth.oauth.unsupportedProvider({ provider })
      : getErrorMessage(ErrorCode.OAUTH_UNSUPPORTED_PROVIDER);
  }

  /**
   * Get localized error message for unconfigured provider
   */
  private getNotConfiguredError(t: TranslationFunctions | undefined, provider: string): string {
    return t
      ? t.auth.oauth.notConfigured({ provider })
      : getErrorMessage(ErrorCode.OAUTH_PROVIDER_NOT_CONFIGURED);
  }

  async execute(query: GetOAuthAuthorizationUrlQuery): Promise<Result<OAuthAuthorizationUrlDto>> {
    // 1. Validate provider
    const providerResult = AuthProvider.create(query.provider);
    if (providerResult.isFailure) {
      return Result.fail(this.getUnsupportedProviderError(query.t, query.provider));
    }
    const provider = providerResult.getValue();

    // 2. Check if provider is enabled
    if (!this.oauthService.isProviderEnabled(provider)) {
      return Result.fail(this.getNotConfiguredError(query.t, query.provider));
    }

    // 3. Generate state if not provided (for CSRF protection)
    const state = query.state || this.generateSecureState();

    // 4. Generate code verifier for PKCE if not provided
    const codeVerifier = query.codeVerifier || this.generateCodeVerifier();

    // 5. Get authorization URL
    const urlResult = await this.oauthService.getAuthorizationUrl(provider, state, codeVerifier);

    if (urlResult.isFailure) {
      return Result.fail(urlResult.getError() as string);
    }

    return Result.ok({
      authorizationUrl: urlResult.getValue(),
      state,
      codeVerifier,
    });
  }

  /**
   * Generate a cryptographically secure state parameter
   * Used for CSRF protection in OAuth flow
   */
  private generateSecureState(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate a PKCE code verifier
   * Must be between 43-128 characters, URL-safe base64
   */
  private generateCodeVerifier(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    // Convert to base64url (URL-safe base64 without padding)
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}
