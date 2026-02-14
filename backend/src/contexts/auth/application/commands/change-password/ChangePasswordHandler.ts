import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import {
  ErrorCode,
  getErrorMessage,
  getLocalizedErrorMessage,
} from '@shared/domain/errors/ErrorCodes.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { ChangePasswordCommand } from './ChangePasswordCommand.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import type { IPasswordHasher } from '../../../domain/services/IPasswordHasher.ts';
import type { IRefreshTokenRepository } from '../../../domain/repositories/IRefreshTokenRepository.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import { Password } from '../../../domain/value-objects/Password.ts';
import { createLogger } from '@shared/infrastructure/logging/Logger.ts';

const logger = createLogger('ChangePassword');

/**
 * ChangePasswordHandler
 * Handles user password change with the following steps:
 * 1. Validate user ID
 * 2. Find user
 * 3. Verify current password
 * 4. Validate new password is different
 * 5. Hash and save new password
 * 6. Invalidate all refresh tokens for security
 */
export class ChangePasswordHandler implements ICommandHandler<ChangePasswordCommand, void> {
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

  async execute(command: ChangePasswordCommand): Promise<Result<void>> {
    const { t } = command;

    // 1. Validate user ID
    const userIdResult = UserId.createFromString(command.userId);
    if (userIdResult.isFailure) {
      return Result.fail(this.getError(t, ErrorCode.INVALID_USER_ID));
    }
    const userId = userIdResult.getValue();

    // 2. Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.fail(this.getError(t, ErrorCode.USER_NOT_FOUND));
    }

    // 3. Check if user is active
    if (!user.isActive()) {
      return Result.fail(this.getError(t, ErrorCode.USER_NOT_FOUND));
    }

    // 4. Verify current password
    const isCurrentPasswordValid = await this.passwordHasher.compare(
      command.currentPassword,
      user.getPassword().getHash()
    );
    if (!isCurrentPasswordValid) {
      return Result.fail(this.getError(t, ErrorCode.CURRENT_PASSWORD_INCORRECT));
    }

    // 5. Verify new password is different from current
    const isNewPasswordSameAsCurrent = await this.passwordHasher.compare(
      command.newPassword,
      user.getPassword().getHash()
    );
    if (isNewPasswordSameAsCurrent) {
      return Result.fail(this.getError(t, ErrorCode.NEW_PASSWORD_SAME_AS_CURRENT));
    }

    // 6. Hash new password
    let hashedPassword: string;
    try {
      hashedPassword = await this.passwordHasher.hash(command.newPassword);
    } catch {
      return Result.fail(this.getError(t, ErrorCode.PASSWORD_HASH_FAILED));
    }

    // 7. Create Password value object
    const passwordOrError = Password.create(hashedPassword);
    if (passwordOrError.isFailure) {
      return Result.fail(this.getError(t, ErrorCode.INVALID_PASSWORD_HASH));
    }
    const newPassword = passwordOrError.getValue();

    // 8. Update user password
    user.updatePassword(newPassword);

    // 9. Persist updated user
    try {
      await this.userRepository.save(user);
    } catch {
      return Result.fail(this.getError(t, ErrorCode.SAVE_USER_FAILED));
    }

    // 10. Invalidate all refresh tokens for security
    try {
      await this.refreshTokenRepository.revokeAllForUser(userId);
    } catch {
      // Log but don't fail - password was successfully changed
      logger.warn(`Failed to revoke tokens for user ${userId.toValue()} after password change`);
    }

    return Result.ok(undefined);
  }
}
