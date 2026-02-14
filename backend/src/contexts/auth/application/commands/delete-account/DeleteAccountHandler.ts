import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import {
  ErrorCode,
  getErrorMessage,
  getLocalizedErrorMessage,
} from '@shared/domain/errors/ErrorCodes.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { DeleteAccountCommand } from './DeleteAccountCommand.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import type { IPasswordHasher } from '../../../domain/services/IPasswordHasher.ts';
import type { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import { createLogger } from '@shared/infrastructure/logging/Logger.ts';

const logger = createLogger('DeleteAccount');

/**
 * DeleteAccountHandler
 * Handles user account deletion (soft delete) with the following steps:
 * 1. Validate user ID
 * 2. Find user
 * 3. Verify password for security
 * 4. Deactivate account (soft delete)
 * 5. Invalidate all refresh tokens
 */
export class DeleteAccountHandler implements ICommandHandler<DeleteAccountCommand, void> {
  constructor(
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher,
    private refreshTokenRepository: IRefreshTokenRepository
  ) {}

  /**
   * Get error message with i18n support
   */
  private getError(
    t: TranslationFunctions | undefined,
    code: ErrorCode
  ): string {
    return t ? getLocalizedErrorMessage(code, t) : getErrorMessage(code);
  }

  async execute(command: DeleteAccountCommand): Promise<Result<void>> {
    const { t } = command;

    // 1. Validate password is provided
    if (!command.password || command.password.trim().length === 0) {
      return Result.fail(this.getError(t, ErrorCode.ACCOUNT_DELETION_REQUIRES_PASSWORD));
    }

    // 2. Validate user ID
    const userIdResult = UserId.createFromString(command.userId);
    if (userIdResult.isFailure) {
      return Result.fail(this.getError(t, ErrorCode.INVALID_USER_ID));
    }
    const userId = userIdResult.getValue();

    // 3. Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.fail(this.getError(t, ErrorCode.USER_NOT_FOUND));
    }

    // 4. Check if user is already deactivated
    if (!user.isActive()) {
      return Result.fail(this.getError(t, ErrorCode.USER_NOT_FOUND));
    }

    // 5. Verify password
    const isPasswordValid = await this.passwordHasher.compare(
      command.password,
      user.getPassword().getHash()
    );
    if (!isPasswordValid) {
      return Result.fail(this.getError(t, ErrorCode.INVALID_PASSWORD));
    }

    // 6. Deactivate account (soft delete)
    user.deactivate();

    // 7. Persist updated user
    try {
      await this.userRepository.save(user);
    } catch {
      return Result.fail(this.getError(t, ErrorCode.SAVE_USER_FAILED));
    }

    // 8. Invalidate all refresh tokens
    try {
      await this.refreshTokenRepository.revokeAllForUser(userId);
    } catch {
      // Log but don't fail - account was successfully deactivated
      logger.warn(`Failed to revoke tokens for user ${userId.toValue()} after account deletion`);
    }

    return Result.ok(undefined);
  }
}
