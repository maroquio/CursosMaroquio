import { Result } from '@shared/domain/Result.ts';
import {
  ErrorCode,
  getErrorMessage,
  getLocalizedErrorMessage,
} from '@shared/domain/errors/ErrorCodes.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { OAuthConnection } from '../../../domain/entities/OAuthConnection.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import { AuthProvider } from '../../../domain/value-objects/AuthProvider.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import type { IOAuthConnectionRepository } from '../../../domain/repositories/IOAuthConnectionRepository.ts';
import type { IOAuthService } from '../../../domain/services/IOAuthService.ts';
import type { LinkOAuthAccountCommand } from './LinkOAuthAccountCommand.ts';

/**
 * Response for successful account linking
 */
export interface LinkOAuthAccountResponse {
  provider: string;
  email: string | null;
  name: string | null;
  linkedAt: string;
}

/**
 * Link OAuth Account Handler
 * Links an OAuth provider to an existing user account
 *
 * Validates:
 * - User exists
 * - Provider is not already linked to this user
 * - OAuth account is not linked to another user
 */
export class LinkOAuthAccountHandler {
  constructor(
    private userRepository: IUserRepository,
    private oauthConnectionRepository: IOAuthConnectionRepository,
    private oauthService: IOAuthService
  ) {}

  /**
   * Get error message with i18n support
   */
  private getError(t: TranslationFunctions | undefined, code: ErrorCode): string {
    return t ? getLocalizedErrorMessage(code, t) : getErrorMessage(code);
  }

  async execute(command: LinkOAuthAccountCommand): Promise<Result<LinkOAuthAccountResponse>> {
    // 1. Validate user ID
    const userIdResult = UserId.createFromString(command.userId);
    if (userIdResult.isFailure) {
      return Result.fail(this.getError(command.t, ErrorCode.INVALID_USER_ID));
    }
    const userId = userIdResult.getValue();

    // 2. Validate provider
    const providerResult = AuthProvider.create(command.provider);
    if (providerResult.isFailure) {
      return Result.fail(
        command.t
          ? command.t.auth.oauth.unsupportedProvider({ provider: command.provider })
          : getErrorMessage(ErrorCode.OAUTH_UNSUPPORTED_PROVIDER)
      );
    }
    const provider = providerResult.getValue();

    // 3. Check if provider is enabled
    if (!this.oauthService.isProviderEnabled(provider)) {
      return Result.fail(
        command.t
          ? command.t.auth.oauth.notConfigured({ provider: command.provider })
          : getErrorMessage(ErrorCode.OAUTH_PROVIDER_NOT_CONFIGURED)
      );
    }

    // 4. Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.fail(this.getError(command.t, ErrorCode.USER_NOT_FOUND));
    }

    // 5. Check if user already has this provider linked
    const existingUserConnection = await this.oauthConnectionRepository.findByUserIdAndProvider(
      userId,
      provider
    );
    if (existingUserConnection) {
      return Result.fail(
        command.t
          ? command.t.auth.oauth.alreadyLinked({ provider: command.provider })
          : `You already have ${command.provider} linked to your account`
      );
    }

    // 6. Exchange code for tokens and profile
    const oauthResult = await this.oauthService.exchangeCodeForTokens(
      provider,
      command.code,
      command.codeVerifier
    );

    if (oauthResult.isFailure) {
      return Result.fail(oauthResult.getError() as string);
    }

    const { profile, tokens } = oauthResult.getValue();

    // 7. Check if this OAuth account is linked to another user
    const existingConnection = await this.oauthConnectionRepository.findByProviderAndProviderUserId(
      provider,
      profile.getProviderUserId()
    );

    if (existingConnection && !existingConnection.getUserId().equals(userId)) {
      return Result.fail(
        command.t
          ? command.t.auth.oauth.linkedToAnotherUser({ provider: command.provider })
          : `This ${command.provider} account is already linked to another user`
      );
    }

    // 8. Create OAuth connection
    const connectionResult = OAuthConnection.create({
      userId,
      profile,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.expiresAt,
    });

    if (connectionResult.isFailure) {
      return Result.fail(connectionResult.getError() as string);
    }

    const connection = connectionResult.getValue();

    // 9. Save connection
    await this.oauthConnectionRepository.save(connection);

    // 10. Return success response
    return Result.ok({
      provider: provider.getValue(),
      email: profile.getEmail(),
      name: profile.getName(),
      linkedAt: connection.getCreatedAt().toISOString(),
    });
  }
}
