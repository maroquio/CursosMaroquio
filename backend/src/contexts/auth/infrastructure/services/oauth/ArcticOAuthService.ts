import { Google, Facebook, Apple, generateState, generateCodeVerifier } from 'arctic';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import {
  env,
  isGoogleOAuthEnabled,
  isFacebookOAuthEnabled,
  isAppleOAuthEnabled,
} from '@shared/config/env.ts';
import { AuthProvider, OAuthProviders } from '../../../domain/value-objects/AuthProvider.ts';
import { OAuthProfile } from '../../../domain/value-objects/OAuthProfile.ts';
import type {
  IOAuthService,
  OAuthTokens,
  OAuthResult,
} from '../../../domain/services/IOAuthService.ts';

/**
 * Google user info response
 */
interface GoogleUserInfo {
  sub: string; // Google user ID
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

/**
 * Facebook user info response
 */
interface FacebookUserInfo {
  id: string;
  email?: string;
  name?: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
}

/**
 * Apple ID token claims
 */
interface AppleIdTokenClaims {
  sub: string; // Apple user ID
  email?: string;
  email_verified?: boolean | string;
  is_private_email?: boolean | string;
}

/**
 * Arctic-based OAuth Service Implementation
 * Handles OAuth 2.0 / OpenID Connect flows for Google, Facebook, and Apple
 */
export class ArcticOAuthService implements IOAuthService {
  private google: Google | null = null;
  private facebook: Facebook | null = null;
  private apple: Apple | null = null;

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize OAuth providers based on environment configuration
   * Only providers with complete credentials are initialized
   */
  private initializeProviders(): void {
    const baseUrl = env.OAUTH_REDIRECT_BASE_URL;

    // Initialize Google OAuth
    if (isGoogleOAuthEnabled()) {
      this.google = new Google(
        env.GOOGLE_CLIENT_ID!,
        env.GOOGLE_CLIENT_SECRET!,
        `${baseUrl}/v1/auth/oauth/google/callback`
      );
    }

    // Initialize Facebook OAuth
    if (isFacebookOAuthEnabled()) {
      this.facebook = new Facebook(
        env.FACEBOOK_APP_ID!,
        env.FACEBOOK_APP_SECRET!,
        `${baseUrl}/v1/auth/oauth/facebook/callback`
      );
    }

    // Initialize Apple Sign-In
    if (isAppleOAuthEnabled()) {
      // Apple private key is stored as base64 in env
      // Arctic expects the private key as Uint8Array
      const privateKeyBytes = Buffer.from(env.APPLE_PRIVATE_KEY!, 'base64');
      this.apple = new Apple(
        env.APPLE_CLIENT_ID!,
        env.APPLE_TEAM_ID!,
        env.APPLE_KEY_ID!,
        new Uint8Array(privateKeyBytes),
        `${baseUrl}/v1/auth/oauth/apple/callback`
      );
    }
  }

  /**
   * Check if a provider is enabled
   */
  public isProviderEnabled(provider: AuthProvider): boolean {
    switch (provider.getValue()) {
      case OAuthProviders.GOOGLE:
        return this.google !== null;
      case OAuthProviders.FACEBOOK:
        return this.facebook !== null;
      case OAuthProviders.APPLE:
        return this.apple !== null;
      default:
        return false;
    }
  }

  /**
   * Get list of enabled providers
   */
  public getEnabledProviders(): AuthProvider[] {
    const providers: AuthProvider[] = [];
    if (this.google) providers.push(AuthProvider.GOOGLE);
    if (this.facebook) providers.push(AuthProvider.FACEBOOK);
    if (this.apple) providers.push(AuthProvider.APPLE);
    return providers;
  }

  /**
   * Generate authorization URL for a provider
   */
  public async getAuthorizationUrl(
    provider: AuthProvider,
    state: string,
    codeVerifier?: string
  ): Promise<Result<string>> {
    try {
      switch (provider.getValue()) {
        case OAuthProviders.GOOGLE:
          return this.getGoogleAuthorizationUrl(state, codeVerifier);
        case OAuthProviders.FACEBOOK:
          return this.getFacebookAuthorizationUrl(state);
        case OAuthProviders.APPLE:
          return this.getAppleAuthorizationUrl(state);
        default:
          return Result.fail(ErrorCode.OAUTH_UNSUPPORTED_PROVIDER);
      }
    } catch (_error) {
      return Result.fail(ErrorCode.OAUTH_AUTHORIZATION_URL_FAILED);
    }
  }

  /**
   * Exchange authorization code for tokens and fetch profile
   */
  public async exchangeCodeForTokens(
    provider: AuthProvider,
    code: string,
    codeVerifier?: string
  ): Promise<Result<OAuthResult>> {
    try {
      switch (provider.getValue()) {
        case OAuthProviders.GOOGLE:
          return this.handleGoogleCallback(code, codeVerifier);
        case OAuthProviders.FACEBOOK:
          return this.handleFacebookCallback(code);
        case OAuthProviders.APPLE:
          return this.handleAppleCallback(code);
        default:
          return Result.fail(ErrorCode.OAUTH_UNSUPPORTED_PROVIDER);
      }
    } catch (_error) {
      return Result.fail(ErrorCode.OAUTH_CODE_EXCHANGE_FAILED);
    }
  }

  /**
   * Refresh access token (not supported by all providers)
   */
  public async refreshAccessToken(
    provider: AuthProvider,
    refreshToken: string
  ): Promise<Result<OAuthTokens>> {
    try {
      switch (provider.getValue()) {
        case OAuthProviders.GOOGLE:
          return this.refreshGoogleToken(refreshToken);
        case OAuthProviders.FACEBOOK:
          // Facebook long-lived tokens don't use refresh tokens
          return Result.fail(ErrorCode.OAUTH_FACEBOOK_NO_REFRESH);
        case OAuthProviders.APPLE:
          return this.refreshAppleToken(refreshToken);
        default:
          return Result.fail(ErrorCode.OAUTH_UNSUPPORTED_PROVIDER);
      }
    } catch (_error) {
      return Result.fail(ErrorCode.OAUTH_TOKEN_REFRESH_FAILED);
    }
  }

  /**
   * Revoke token (best effort, not all providers support)
   */
  public async revokeToken(provider: AuthProvider, accessToken: string): Promise<Result<void>> {
    try {
      switch (provider.getValue()) {
        case OAuthProviders.GOOGLE:
          await this.revokeGoogleToken(accessToken);
          return Result.ok<void>(undefined);
        case OAuthProviders.FACEBOOK:
          // Facebook token revocation would require app secret
          return Result.ok<void>(undefined);
        case OAuthProviders.APPLE:
          // Apple doesn't have a direct revocation endpoint for refresh tokens
          return Result.ok<void>(undefined);
        default:
          return Result.fail(ErrorCode.OAUTH_UNSUPPORTED_PROVIDER);
      }
    } catch (_error) {
      // Token revocation is best-effort
      return Result.ok<void>(undefined);
    }
  }

  // ========== Google Implementation ==========

  private async getGoogleAuthorizationUrl(state: string, codeVerifier?: string): Promise<Result<string>> {
    if (!this.google) {
      return Result.fail(ErrorCode.OAUTH_PROVIDER_NOT_CONFIGURED);
    }

    const scopes = ['openid', 'email', 'profile'];
    const url = this.google.createAuthorizationURL(state, codeVerifier ?? generateCodeVerifier(), scopes);
    return Result.ok(url.toString());
  }

  private async handleGoogleCallback(code: string, codeVerifier?: string): Promise<Result<OAuthResult>> {
    if (!this.google) {
      return Result.fail(ErrorCode.OAUTH_PROVIDER_NOT_CONFIGURED);
    }

    // Exchange code for tokens
    const tokens = await this.google.validateAuthorizationCode(code, codeVerifier ?? '');

    // Fetch user info
    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.accessToken()}` },
    });

    if (!response.ok) {
      return Result.fail(ErrorCode.OAUTH_USER_INFO_FAILED);
    }

    const userInfo = (await response.json()) as GoogleUserInfo;

    // Create profile
    const profileResult = OAuthProfile.create({
      provider: AuthProvider.GOOGLE,
      providerUserId: userInfo.sub,
      email: userInfo.email ?? null,
      name: userInfo.name ?? null,
      avatarUrl: userInfo.picture ?? null,
    });

    if (profileResult.isFailure) {
      return Result.fail(profileResult.getError() as string);
    }

    return Result.ok({
      profile: profileResult.getValue(),
      tokens: {
        accessToken: tokens.accessToken(),
        refreshToken: tokens.refreshToken() ?? null,
        expiresAt: tokens.accessTokenExpiresAt() ?? null,
        idToken: tokens.idToken() ?? null,
      },
    });
  }

  private async refreshGoogleToken(refreshToken: string): Promise<Result<OAuthTokens>> {
    if (!this.google) {
      return Result.fail(ErrorCode.OAUTH_PROVIDER_NOT_CONFIGURED);
    }

    const tokens = await this.google.refreshAccessToken(refreshToken);

    return Result.ok({
      accessToken: tokens.accessToken(),
      refreshToken: tokens.refreshToken() ?? refreshToken,
      expiresAt: tokens.accessTokenExpiresAt() ?? null,
    });
  }

  private async revokeGoogleToken(accessToken: string): Promise<void> {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
      method: 'POST',
    });
  }

  // ========== Facebook Implementation ==========

  private async getFacebookAuthorizationUrl(state: string): Promise<Result<string>> {
    if (!this.facebook) {
      return Result.fail(ErrorCode.OAUTH_PROVIDER_NOT_CONFIGURED);
    }

    const scopes = ['email', 'public_profile'];
    const url = this.facebook.createAuthorizationURL(state, scopes);
    return Result.ok(url.toString());
  }

  private async handleFacebookCallback(code: string): Promise<Result<OAuthResult>> {
    if (!this.facebook) {
      return Result.fail(ErrorCode.OAUTH_PROVIDER_NOT_CONFIGURED);
    }

    // Exchange code for tokens
    const tokens = await this.facebook.validateAuthorizationCode(code);

    // Fetch user info from Graph API
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,email,name,picture.type(large)&access_token=${tokens.accessToken()}`
    );

    if (!response.ok) {
      return Result.fail(ErrorCode.OAUTH_USER_INFO_FAILED);
    }

    const userInfo = (await response.json()) as FacebookUserInfo;

    // Create profile
    const profileResult = OAuthProfile.create({
      provider: AuthProvider.FACEBOOK,
      providerUserId: userInfo.id,
      email: userInfo.email ?? null,
      name: userInfo.name ?? null,
      avatarUrl: userInfo.picture?.data?.url ?? null,
    });

    if (profileResult.isFailure) {
      return Result.fail(profileResult.getError() as string);
    }

    return Result.ok({
      profile: profileResult.getValue(),
      tokens: {
        accessToken: tokens.accessToken(),
        refreshToken: null, // Facebook doesn't use refresh tokens for user tokens
        expiresAt: tokens.accessTokenExpiresAt() ?? null,
      },
    });
  }

  // ========== Apple Implementation ==========

  private async getAppleAuthorizationUrl(state: string): Promise<Result<string>> {
    if (!this.apple) {
      return Result.fail(ErrorCode.OAUTH_PROVIDER_NOT_CONFIGURED);
    }

    const scopes = ['email', 'name'];
    const url = this.apple.createAuthorizationURL(state, scopes);
    return Result.ok(url.toString());
  }

  private async handleAppleCallback(code: string): Promise<Result<OAuthResult>> {
    if (!this.apple) {
      return Result.fail(ErrorCode.OAUTH_PROVIDER_NOT_CONFIGURED);
    }

    // Exchange code for tokens
    const tokens = await this.apple.validateAuthorizationCode(code);

    // Apple includes user info in the ID token
    const idToken = tokens.idToken();
    if (!idToken) {
      return Result.fail(ErrorCode.OAUTH_NO_ID_TOKEN);
    }

    // Decode ID token to get claims (Arctic validates the signature)
    let claims: AppleIdTokenClaims;
    try {
      claims = this.decodeJwtPayload(idToken) as unknown as AppleIdTokenClaims;
    } catch {
      return Result.fail(ErrorCode.OAUTH_INVALID_JWT_FORMAT);
    }

    // Create profile
    // Note: Apple only sends name on first authentication
    const profileResult = OAuthProfile.create({
      provider: AuthProvider.APPLE,
      providerUserId: claims.sub,
      email: claims.email ?? null,
      name: null, // Apple sends name separately in form POST, not in ID token
      avatarUrl: null, // Apple doesn't provide avatar URLs
    });

    if (profileResult.isFailure) {
      return Result.fail(profileResult.getError() as string);
    }

    return Result.ok({
      profile: profileResult.getValue(),
      tokens: {
        accessToken: tokens.accessToken(),
        refreshToken: tokens.refreshToken() ?? null,
        expiresAt: tokens.accessTokenExpiresAt() ?? null,
        idToken,
      },
    });
  }

  private async refreshAppleToken(_refreshToken: string): Promise<Result<OAuthTokens>> {
    if (!this.apple) {
      return Result.fail(ErrorCode.OAUTH_PROVIDER_NOT_CONFIGURED);
    }

    // Apple's Arctic implementation doesn't support refreshAccessToken
    // Apple tokens typically don't need refresh - they use long-lived refresh tokens
    // that are exchanged server-side when needed
    return Result.fail(ErrorCode.OAUTH_APPLE_REFRESH_NOT_SUPPORTED);
  }

  /**
   * Decode JWT payload without verification (signature already verified by Arctic)
   * @throws Error if JWT format is invalid (ErrorCode.OAUTH_INVALID_JWT_FORMAT)
   */
  private decodeJwtPayload(token: string): Record<string, unknown> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error(ErrorCode.OAUTH_INVALID_JWT_FORMAT);
    }
    const payload = Buffer.from(parts[1]!, 'base64url').toString('utf-8');
    return JSON.parse(payload);
  }
}

/**
 * Static helper functions for OAuth flow
 */
export function generateOAuthState(): string {
  return generateState();
}

export function generatePKCECodeVerifier(): string {
  return generateCodeVerifier();
}
