import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import {
  ErrorCode,
  getErrorMessage,
  getLocalizedErrorMessage,
} from '@shared/domain/errors/ErrorCodes.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { ResetPasswordAdminCommand } from './ResetPasswordAdminCommand.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import type { IPasswordHasher } from '../../../domain/services/IPasswordHasher.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import { Password } from '../../../domain/value-objects/Password.ts';

/**
 * ResetPasswordAdminHandler
 * Handles admin password reset for users
 * Only administrators can reset passwords via this handler
 */
export class ResetPasswordAdminHandler
  implements ICommandHandler<ResetPasswordAdminCommand>
{
  constructor(
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher
  ) {}

  /**
   * Get localized message with fallback
   */
  private msg(
    t: TranslationFunctions | undefined,
    getMessage: (t: TranslationFunctions) => string,
    fallback: string
  ): string {
    return t ? getMessage(t) : fallback;
  }

  /**
   * Get error message with i18n support
   */
  private getError(
    t: TranslationFunctions | undefined,
    code: ErrorCode
  ): string {
    return t ? getLocalizedErrorMessage(code, t) : getErrorMessage(code);
  }

  async execute(command: ResetPasswordAdminCommand): Promise<Result<void>> {
    const { t } = command;

    // 1. Validate resetter is admin
    const resetterIdResult = UserId.createFromString(command.resetByUserId);
    if (resetterIdResult.isFailure) {
      return Result.fail(this.getError(t, ErrorCode.INVALID_USER_ID));
    }
    const resetterId = resetterIdResult.getValue();

    const resetter = await this.userRepository.findById(resetterId);
    if (!resetter) {
      return Result.fail(
        this.msg(t, (t) => t.middleware.creatorNotFound(), 'Resetter not found')
      );
    }
    if (!resetter.isAdmin()) {
      return Result.fail(
        this.msg(
          t,
          (t) => t.middleware.onlyAdmins(),
          'Only administrators can reset passwords'
        )
      );
    }

    // 2. Validate target user ID
    const userIdResult = UserId.createFromString(command.userId);
    if (userIdResult.isFailure) {
      return Result.fail(this.getError(t, ErrorCode.INVALID_USER_ID));
    }
    const userId = userIdResult.getValue();

    // 3. Find target user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.fail(this.getError(t, ErrorCode.USER_NOT_FOUND));
    }

    // 4. Hash new password
    let hashedPassword: string;
    try {
      hashedPassword = await this.passwordHasher.hash(command.newPassword);
    } catch {
      return Result.fail(this.getError(t, ErrorCode.PASSWORD_HASH_FAILED));
    }

    // 5. Create Password value object
    const passwordOrError = Password.create(hashedPassword);
    if (passwordOrError.isFailure) {
      return Result.fail(passwordOrError.getError() as string);
    }
    const password = passwordOrError.getValue();

    // 6. Update user's password
    user.updatePassword(password);

    // 7. Persist changes
    try {
      await this.userRepository.save(user);
    } catch {
      return Result.fail(this.getError(t, ErrorCode.SAVE_USER_FAILED));
    }

    return Result.ok(undefined);
  }
}
