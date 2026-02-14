import { ValueObject } from '@shared/domain/ValueObject.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { AuthProvider } from './AuthProvider.ts';

interface OAuthProfileProps {
  provider: AuthProvider;
  providerUserId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

/**
 * OAuthProfile Value Object
 * Represents the profile data returned by an OAuth provider after authentication
 *
 * Contains:
 * - provider: The OAuth provider (google, facebook, apple)
 * - providerUserId: The user's unique ID at the provider
 * - email: Email address (may be null if user didn't share or provider doesn't provide)
 * - name: Display name (may be null)
 * - avatarUrl: Profile picture URL (may be null)
 *
 * Immutable - profile data cannot be changed after creation
 */
export class OAuthProfile extends ValueObject<OAuthProfileProps> {
  private constructor(props: OAuthProfileProps) {
    super(props);
  }

  /**
   * Create an OAuthProfile from provider data
   * Validates required fields
   */
  public static create(props: {
    provider: AuthProvider;
    providerUserId: string;
    email?: string | null;
    name?: string | null;
    avatarUrl?: string | null;
  }): Result<OAuthProfile> {
    if (!props.provider) {
      return Result.fail(ErrorCode.OAUTH_PROVIDER_REQUIRED);
    }

    if (props.provider.isLocal()) {
      return Result.fail(ErrorCode.OAUTH_PROVIDER_LOCAL_NOT_ALLOWED);
    }

    if (!props.providerUserId || props.providerUserId.trim().length === 0) {
      return Result.fail(ErrorCode.OAUTH_PROVIDER_USER_ID_REQUIRED);
    }

    // Validate email format if provided
    if (props.email !== null && props.email !== undefined && props.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(props.email)) {
        return Result.fail(ErrorCode.OAUTH_INVALID_EMAIL_FORMAT);
      }
    }

    // Validate avatar URL format if provided
    if (props.avatarUrl !== null && props.avatarUrl !== undefined && props.avatarUrl.trim().length > 0) {
      try {
        new URL(props.avatarUrl);
      } catch {
        return Result.fail(ErrorCode.OAUTH_INVALID_AVATAR_URL);
      }
    }

    return Result.ok(
      new OAuthProfile({
        provider: props.provider,
        providerUserId: props.providerUserId.trim(),
        email: props.email?.trim() || null,
        name: props.name?.trim() || null,
        avatarUrl: props.avatarUrl?.trim() || null,
      })
    );
  }

  /**
   * Get the provider
   */
  public getProvider(): AuthProvider {
    return this.props.provider;
  }

  /**
   * Get the provider user ID
   */
  public getProviderUserId(): string {
    return this.props.providerUserId;
  }

  /**
   * Get the email address (may be null)
   */
  public getEmail(): string | null {
    return this.props.email;
  }

  /**
   * Get the display name (may be null)
   */
  public getName(): string | null {
    return this.props.name;
  }

  /**
   * Get the avatar URL (may be null)
   */
  public getAvatarUrl(): string | null {
    return this.props.avatarUrl;
  }

  /**
   * Check if the profile has an email
   */
  public hasEmail(): boolean {
    return this.props.email !== null;
  }

  /**
   * Check if the profile has a name
   */
  public hasName(): boolean {
    return this.props.name !== null;
  }

  /**
   * Check if the profile has an avatar
   */
  public hasAvatar(): boolean {
    return this.props.avatarUrl !== null;
  }

  /**
   * Check if this is an Apple hidden email (privaterelay.appleid.com)
   * Apple allows users to hide their real email
   */
  public isAppleHiddenEmail(): boolean {
    return this.props.email?.endsWith('@privaterelay.appleid.com') ?? false;
  }

  /**
   * Compare two profiles for equality
   */
  public override equals(other: OAuthProfile): boolean {
    return (
      this.props.provider.equals(other.getProvider()) &&
      this.props.providerUserId === other.getProviderUserId()
    );
  }
}
