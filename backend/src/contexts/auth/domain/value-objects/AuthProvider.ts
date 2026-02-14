import { ValueObject } from '@shared/domain/ValueObject.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

/**
 * Supported OAuth providers
 * 'local' represents email/password authentication
 */
export const OAuthProviders = {
  LOCAL: 'local',
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
  APPLE: 'apple',
} as const;

export type OAuthProviderType = (typeof OAuthProviders)[keyof typeof OAuthProviders];

interface AuthProviderProps {
  value: OAuthProviderType;
}

/**
 * AuthProvider Value Object
 * Represents an authentication provider (local, google, facebook, apple)
 *
 * Immutable - provider type cannot be changed after creation
 */
export class AuthProvider extends ValueObject<AuthProviderProps> {
  private constructor(value: OAuthProviderType) {
    super({ value });
  }

  /**
   * Pre-defined provider instances for convenience
   */
  public static readonly LOCAL = new AuthProvider(OAuthProviders.LOCAL);
  public static readonly GOOGLE = new AuthProvider(OAuthProviders.GOOGLE);
  public static readonly FACEBOOK = new AuthProvider(OAuthProviders.FACEBOOK);
  public static readonly APPLE = new AuthProvider(OAuthProviders.APPLE);

  /**
   * Create an AuthProvider from a string
   * Validates that the provider is supported
   */
  public static create(value: string): Result<AuthProvider> {
    if (!value || value.trim().length === 0) {
      return Result.fail(ErrorCode.AUTH_PROVIDER_EMPTY);
    }

    const normalizedValue = value.toLowerCase().trim();

    if (!this.isValidProvider(normalizedValue)) {
      return Result.fail(ErrorCode.AUTH_PROVIDER_INVALID);
    }

    return Result.ok(new AuthProvider(normalizedValue as OAuthProviderType));
  }

  /**
   * Create an AuthProvider from a string, throwing if invalid
   * Use only when you're certain the value is valid
   */
  public static fromString(value: string): AuthProvider {
    const result = this.create(value);
    if (result.isFailure) {
      const error = result.getError();
      throw new Error(typeof error === 'string' ? error : error?.message);
    }
    return result.getValue();
  }

  /**
   * Check if a string is a valid provider
   */
  public static isValidProvider(value: string): value is OAuthProviderType {
    return Object.values(OAuthProviders).includes(value as OAuthProviderType);
  }

  /**
   * Get the provider value as a string
   */
  public getValue(): OAuthProviderType {
    return this.props.value;
  }

  /**
   * Check if this is local (email/password) authentication
   */
  public isLocal(): boolean {
    return this.props.value === OAuthProviders.LOCAL;
  }

  /**
   * Check if this is an OAuth provider (not local)
   */
  public isOAuth(): boolean {
    return this.props.value !== OAuthProviders.LOCAL;
  }

  /**
   * Check if this is Google OAuth
   */
  public isGoogle(): boolean {
    return this.props.value === OAuthProviders.GOOGLE;
  }

  /**
   * Check if this is Facebook OAuth
   */
  public isFacebook(): boolean {
    return this.props.value === OAuthProviders.FACEBOOK;
  }

  /**
   * Check if this is Apple Sign-In
   */
  public isApple(): boolean {
    return this.props.value === OAuthProviders.APPLE;
  }

  /**
   * Get all supported OAuth providers (excluding local)
   */
  public static getOAuthProviders(): OAuthProviderType[] {
    return [OAuthProviders.GOOGLE, OAuthProviders.FACEBOOK, OAuthProviders.APPLE];
  }

  /**
   * Get all supported providers (including local)
   */
  public static getAllProviders(): OAuthProviderType[] {
    return Object.values(OAuthProviders);
  }

  /**
   * Compare two providers for equality
   */
  public override equals(other: AuthProvider): boolean {
    return this.props.value === other.getValue();
  }

  /**
   * String representation
   */
  public override toString(): string {
    return this.props.value;
  }
}
