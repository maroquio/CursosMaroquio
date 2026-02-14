import { Result } from '@shared/domain/Result.ts';
import {
  ErrorCode,
  getErrorMessage,
  getLocalizedErrorMessage,
} from '@shared/domain/errors/ErrorCodes.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { User } from '../../../domain/entities/User.ts';
import { OAuthConnection } from '../../../domain/entities/OAuthConnection.ts';
import { RefreshToken } from '../../../domain/entities/RefreshToken.ts';
import { Email } from '../../../domain/value-objects/Email.ts';
import { Password } from '../../../domain/value-objects/Password.ts';
import { AuthProvider } from '../../../domain/value-objects/AuthProvider.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import type { IOAuthConnectionRepository } from '../../../domain/repositories/IOAuthConnectionRepository.ts';
import type { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository.ts';
import type { IOAuthService } from '../../../domain/services/IOAuthService.ts';
import type { ITokenService } from '../../../domain/services/ITokenService.ts';
import type { OAuthLoginCommand } from './OAuthLoginCommand.ts';
import type { LoginResponse } from '../../dtos/LoginResponse.ts';

/**
 * OAuth Login Handler
 * Authenticates a user via OAuth provider and returns JWT tokens
 *
 * Flow:
 * 1. Exchange authorization code for tokens and profile
 * 2. Check if OAuth connection exists (returning user)
 * 3. If exists: Log in the linked user
 * 4. If not exists:
 *    a. Check if email exists (link to existing account)
 *    b. If no email match: Create new user
 * 5. Create/update OAuth connection
 * 6. Generate and return JWT tokens
 */
export class OAuthLoginHandler {
  constructor(
    private userRepository: IUserRepository,
    private oauthConnectionRepository: IOAuthConnectionRepository,
    private refreshTokenRepository: IRefreshTokenRepository,
    private oauthService: IOAuthService,
    private tokenService: ITokenService
  ) {}

  /**
   * Get error message with i18n support
   */
  private getError(t: TranslationFunctions | undefined, code: ErrorCode): string {
    return t ? getLocalizedErrorMessage(code, t) : getErrorMessage(code);
  }

  async execute(command: OAuthLoginCommand): Promise<Result<LoginResponse>> {
    // 1. Validate and parse provider
    const providerResult = AuthProvider.create(command.provider);
    if (providerResult.isFailure) {
      return Result.fail(
        command.t
          ? command.t.auth.oauth.unsupportedProvider({ provider: command.provider })
          : getErrorMessage(ErrorCode.OAUTH_UNSUPPORTED_PROVIDER)
      );
    }
    const provider = providerResult.getValue();

    // 2. Check if provider is enabled
    if (!this.oauthService.isProviderEnabled(provider)) {
      return Result.fail(
        command.t
          ? command.t.auth.oauth.notConfigured({ provider: command.provider })
          : getErrorMessage(ErrorCode.OAUTH_PROVIDER_NOT_CONFIGURED)
      );
    }

    // 3. Exchange code for tokens and profile
    const oauthResult = await this.oauthService.exchangeCodeForTokens(
      provider,
      command.code,
      command.codeVerifier
    );

    if (oauthResult.isFailure) {
      return Result.fail(oauthResult.getError() as string);
    }

    const { profile, tokens } = oauthResult.getValue();

    // 4. Check if OAuth connection already exists (returning user)
    const existingConnection = await this.oauthConnectionRepository.findByProviderAndProviderUserId(
      provider,
      profile.getProviderUserId()
    );

    let user: User;
    let connection: OAuthConnection;

    if (existingConnection) {
      // 4a. Existing OAuth connection - log in the user
      const existingUser = await this.userRepository.findById(existingConnection.getUserId());
      if (!existingUser) {
        // Orphaned OAuth connection - shouldn't happen, but handle gracefully
        await this.oauthConnectionRepository.delete(existingConnection.getId());
        return Result.fail(this.getError(command.t, ErrorCode.USER_NOT_FOUND));
      }

      user = existingUser;
      connection = existingConnection;

      // Update tokens and profile info
      connection.updateTokens(
        tokens.accessToken,
        tokens.refreshToken,
        tokens.expiresAt
      );
      connection.updateProfile(profile);
    } else {
      // 4b. New OAuth login - check if email exists
      let existingUserByEmail: User | null = null;

      if (profile.hasEmail()) {
        const emailResult = Email.create(profile.getEmail()!);
        if (emailResult.isOk) {
          existingUserByEmail = await this.userRepository.findByEmail(emailResult.getValue());
        }
      }

      if (existingUserByEmail) {
        // Link OAuth to existing user with matching email
        user = existingUserByEmail;
      } else {
        // Create new user
        const userResult = await this.createNewUser(profile, command.t);
        if (userResult.isFailure) {
          return Result.fail(userResult.getError() as string);
        }
        user = userResult.getValue();
        await this.userRepository.save(user);
      }

      // Create OAuth connection
      const connectionResult = OAuthConnection.create({
        userId: user.getId(),
        profile,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
      });

      if (connectionResult.isFailure) {
        return Result.fail(connectionResult.getError() as string);
      }

      connection = connectionResult.getValue();
    }

    // 5. Save OAuth connection (insert or update)
    await this.oauthConnectionRepository.save(connection);

    // 6. Generate JWT access token
    const accessToken = this.tokenService.generateAccessToken(
      user.getId(),
      user.getEmail().getValue(),
      user.getRoleNames()
    );

    // 7. Create and save refresh token
    const refreshToken = RefreshToken.create({
      userId: user.getId(),
      expiresInMs: this.tokenService.getRefreshTokenExpiryMs(),
      userAgent: command.userAgent,
      ipAddress: command.ipAddress,
    });

    await this.refreshTokenRepository.save(refreshToken);

    // 8. Return token pair
    return Result.ok({
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn: Math.floor(this.tokenService.getAccessTokenExpiryMs() / 1000),
      user: {
        id: user.getId().toValue(),
        email: user.getEmail().getValue(),
        fullName: user.getFullName(),
        phone: user.getPhone(),
        photoUrl: user.getPhotoUrl(),
        roles: user.getRoleNames(),
      },
    });
  }

  /**
   * Create a new user from OAuth profile
   * Generates a random password (user can set one later if they want)
   */
  private async createNewUser(
    profile: import('../../../domain/value-objects/OAuthProfile.ts').OAuthProfile,
    t?: TranslationFunctions
  ): Promise<Result<User>> {
    // Use email from OAuth or generate a placeholder
    let email: Email;

    if (profile.hasEmail()) {
      const emailResult = Email.create(profile.getEmail()!, { t });
      if (emailResult.isFailure) {
        return Result.fail(
          t
            ? t.auth.oauth.invalidEmail({ email: profile.getEmail()! })
            : getErrorMessage(ErrorCode.OAUTH_INVALID_EMAIL_FORMAT)
        );
      }
      email = emailResult.getValue();
    } else {
      // Generate placeholder email for providers that don't share email (rare)
      // Format: provider_userid@oauth.placeholder
      const placeholderEmail = `${profile.getProvider().getValue()}_${profile.getProviderUserId()}@oauth.placeholder`;
      const emailResult = Email.create(placeholderEmail);
      if (emailResult.isFailure) {
        return Result.fail(this.getError(t, ErrorCode.OAUTH_PLACEHOLDER_EMAIL_FAILED));
      }
      email = emailResult.getValue();
    }

    // Generate random password (user won't use it for OAuth login)
    // This allows the user to later set a real password if they want email/password login
    const randomPassword = this.generateSecureRandomPassword();
    const passwordResult = Password.create(randomPassword);
    if (passwordResult.isFailure) {
      return Result.fail(this.getError(t, ErrorCode.OAUTH_PASSWORD_GENERATION_FAILED));
    }

    // Use name from OAuth profile or a default based on email
    const emailParts = email.getValue().split('@');
    const emailName = emailParts[0] ?? 'User';
    const fullName: string = profile.getName() || emailName;
    // Phone is not available from OAuth, use empty string
    const phone = '';

    return User.create(email, passwordResult.getValue(), fullName, phone);
  }

  /**
   * Generate a secure random password
   * The user won't actually use this - it's just to satisfy the User entity requirement
   */
  private generateSecureRandomPassword(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
