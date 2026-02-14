import { Result } from '@shared/domain/Result.ts';
import {
  ErrorCode,
  getErrorMessage,
  getLocalizedErrorMessage,
} from '@shared/domain/errors/ErrorCodes.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import { AuthProvider } from '../../../domain/value-objects/AuthProvider.ts';
import { OAuthAccountUnlinked } from '../../../domain/events/OAuthAccountUnlinked.ts';
import { DomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import type { IOAuthConnectionRepository } from '../../../domain/repositories/IOAuthConnectionRepository.ts';
import type { IOAuthService } from '../../../domain/services/IOAuthService.ts';
import type { UnlinkOAuthAccountCommand } from './UnlinkOAuthAccountCommand.ts';

/**
 * Unlink OAuth Account Handler
 * Removes an OAuth provider from a user account
 *
 * Security validations:
 * - User must have at least one other authentication method
 * - Either another OAuth provider OR the ability to login with email/password
 *
 * Note: Currently all users have a password set (even if auto-generated for OAuth-only users).
 * For true "no password" support, we'd need to modify the User entity to allow nullable passwords.
 * For now, we check if the user has other OAuth connections.
 */
export class UnlinkOAuthAccountHandler {
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

  async execute(command: UnlinkOAuthAccountCommand): Promise<Result<void>> {
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

    // 3. Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.fail(this.getError(command.t, ErrorCode.USER_NOT_FOUND));
    }

    // 4. Check if OAuth connection exists
    const connection = await this.oauthConnectionRepository.findByUserIdAndProvider(userId, provider);
    if (!connection) {
      return Result.fail(
        command.t
          ? command.t.auth.oauth.notLinked({ provider: command.provider })
          : `You don't have ${command.provider} linked to your account`
      );
    }

    // 5. Check if user has at least one other authentication method
    // Count other OAuth connections
    const oauthConnectionCount = await this.oauthConnectionRepository.countByUserId(userId);

    // User needs at least one other OAuth connection to unlink
    // (In the future, we could also check if they have a "real" password set)
    if (oauthConnectionCount <= 1) {
      return Result.fail(
        command.t
          ? command.t.auth.oauth.cannotUnlinkOnlyMethod()
          : 'Cannot unlink your only authentication method. ' +
            'Please link another provider or set a password first.'
      );
    }

    // 6. Revoke tokens at the provider (best effort)
    if (connection.getAccessToken()) {
      await this.oauthService.revokeToken(provider, connection.getAccessToken()!);
    }

    // 7. Delete the OAuth connection
    await this.oauthConnectionRepository.delete(connection.getId());

    // 8. Publish domain event
    const event = new OAuthAccountUnlinked(userId, provider);
    DomainEventPublisher.getInstance().publish(event);

    return Result.ok<void>(undefined);
  }
}
