import { Entity } from '@shared/domain/Entity.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { OAuthConnectionId } from '../value-objects/OAuthConnectionId.ts';
import { UserId } from '../value-objects/UserId.ts';
import { AuthProvider } from '../value-objects/AuthProvider.ts';
import { OAuthProfile } from '../value-objects/OAuthProfile.ts';
import { OAuthAccountLinked } from '../events/OAuthAccountLinked.ts';

interface CreateOAuthConnectionProps {
  userId: UserId;
  profile: OAuthProfile;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiresAt?: Date | null;
}

interface ReconstructOAuthConnectionProps {
  id: OAuthConnectionId;
  userId: UserId;
  provider: AuthProvider;
  providerUserId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * OAuthConnection Entity
 * Represents a link between a user and an OAuth provider (Google, Facebook, Apple)
 *
 * A user can have multiple OAuth connections (one per provider)
 * This allows:
 * - Social login (authenticate via OAuth)
 * - Account linking (link OAuth to existing account)
 * - Multiple authentication methods per user
 */
export class OAuthConnection extends Entity<OAuthConnectionId> {
  private constructor(
    id: OAuthConnectionId,
    private readonly _userId: UserId,
    private readonly _provider: AuthProvider,
    private readonly _providerUserId: string,
    private _email: string | null,
    private _name: string | null,
    private _avatarUrl: string | null,
    private _accessToken: string | null,
    private _refreshToken: string | null,
    private _tokenExpiresAt: Date | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {
    super(id);
  }

  /**
   * Create a new OAuth connection
   * Emits OAuthAccountLinked domain event
   */
  public static create(props: CreateOAuthConnectionProps): Result<OAuthConnection> {
    if (!props.userId) {
      return Result.fail(ErrorCode.OAUTH_USER_ID_REQUIRED);
    }

    if (!props.profile) {
      return Result.fail(ErrorCode.OAUTH_PROFILE_REQUIRED);
    }

    const now = new Date();
    const connection = new OAuthConnection(
      OAuthConnectionId.create(),
      props.userId,
      props.profile.getProvider(),
      props.profile.getProviderUserId(),
      props.profile.getEmail(),
      props.profile.getName(),
      props.profile.getAvatarUrl(),
      props.accessToken ?? null,
      props.refreshToken ?? null,
      props.tokenExpiresAt ?? null,
      now,
      now
    );

    // Emit domain event
    connection.addDomainEvent(
      new OAuthAccountLinked(props.userId, props.profile.getProvider(), props.profile.getProviderUserId())
    );

    return Result.ok(connection);
  }

  /**
   * Reconstruct an OAuth connection from persistence
   * Does not emit domain events (already persisted)
   */
  public static reconstruct(props: ReconstructOAuthConnectionProps): OAuthConnection {
    return new OAuthConnection(
      props.id,
      props.userId,
      props.provider,
      props.providerUserId,
      props.email,
      props.name,
      props.avatarUrl,
      props.accessToken,
      props.refreshToken,
      props.tokenExpiresAt,
      props.createdAt,
      props.updatedAt
    );
  }

  // ========== Getters ==========

  /**
   * Get the user ID this connection belongs to
   */
  public getUserId(): UserId {
    return this._userId;
  }

  /**
   * Get the OAuth provider
   */
  public getProvider(): AuthProvider {
    return this._provider;
  }

  /**
   * Get the provider-specific user ID
   */
  public getProviderUserId(): string {
    return this._providerUserId;
  }

  /**
   * Get the email from the OAuth provider (may differ from user's primary email)
   */
  public getEmail(): string | null {
    return this._email;
  }

  /**
   * Get the name from the OAuth provider
   */
  public getName(): string | null {
    return this._name;
  }

  /**
   * Get the avatar URL from the OAuth provider
   */
  public getAvatarUrl(): string | null {
    return this._avatarUrl;
  }

  /**
   * Get the provider's access token
   * Useful for making API calls on behalf of the user
   */
  public getAccessToken(): string | null {
    return this._accessToken;
  }

  /**
   * Get the provider's refresh token
   * Useful for refreshing expired access tokens
   */
  public getRefreshToken(): string | null {
    return this._refreshToken;
  }

  /**
   * Get the expiration time of the access token
   */
  public getTokenExpiresAt(): Date | null {
    return this._tokenExpiresAt;
  }

  /**
   * Get the creation timestamp
   */
  public getCreatedAt(): Date {
    return this._createdAt;
  }

  /**
   * Get the last update timestamp
   */
  public getUpdatedAt(): Date {
    return this._updatedAt;
  }

  // ========== Token Management ==========

  /**
   * Check if the access token is expired
   */
  public isTokenExpired(): boolean {
    if (!this._tokenExpiresAt) {
      return true; // No expiration info, assume expired
    }
    return new Date() >= this._tokenExpiresAt;
  }

  /**
   * Check if this connection has valid tokens
   */
  public hasValidToken(): boolean {
    return this._accessToken !== null && !this.isTokenExpired();
  }

  /**
   * Update the OAuth tokens
   * Call this after refreshing tokens with the provider
   */
  public updateTokens(accessToken: string, refreshToken?: string | null, expiresAt?: Date | null): void {
    this._accessToken = accessToken;
    if (refreshToken !== undefined) {
      this._refreshToken = refreshToken;
    }
    if (expiresAt !== undefined) {
      this._tokenExpiresAt = expiresAt;
    }
    this._updatedAt = new Date();
  }

  /**
   * Update profile information from OAuth provider
   * Call this when re-authenticating to sync latest profile data
   */
  public updateProfile(profile: OAuthProfile): Result<void> {
    if (!profile.getProvider().equals(this._provider)) {
      return Result.fail(ErrorCode.OAUTH_CANNOT_UPDATE_DIFFERENT_PROVIDER);
    }

    if (profile.getProviderUserId() !== this._providerUserId) {
      return Result.fail(ErrorCode.OAUTH_CANNOT_UPDATE_DIFFERENT_PROVIDER_ID);
    }

    this._email = profile.getEmail();
    this._name = profile.getName();
    this._avatarUrl = profile.getAvatarUrl();
    this._updatedAt = new Date();

    return Result.ok<void>(undefined);
  }

  // ========== Utility Methods ==========

  /**
   * Check if this is a Google connection
   */
  public isGoogle(): boolean {
    return this._provider.isGoogle();
  }

  /**
   * Check if this is a Facebook connection
   */
  public isFacebook(): boolean {
    return this._provider.isFacebook();
  }

  /**
   * Check if this is an Apple connection
   */
  public isApple(): boolean {
    return this._provider.isApple();
  }
}
