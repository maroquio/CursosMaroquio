import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import {
  ErrorCode,
  getErrorMessage,
  getLocalizedErrorMessage,
} from '@shared/domain/errors/ErrorCodes.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { ActivateUserCommand } from './ActivateUserCommand.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';

/**
 * ActivateUserHandler
 * Handles user reactivation
 * Only administrators can reactivate users
 */
export class ActivateUserHandler implements ICommandHandler<ActivateUserCommand> {
  constructor(private userRepository: IUserRepository) {}

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

  async execute(command: ActivateUserCommand): Promise<Result<void>> {
    const { t } = command;

    // 1. Validate activator is admin
    const activatorIdResult = UserId.createFromString(command.activatedByUserId);
    if (activatorIdResult.isFailure) {
      return Result.fail(this.getError(t, ErrorCode.INVALID_USER_ID));
    }
    const activatorId = activatorIdResult.getValue();

    const activator = await this.userRepository.findById(activatorId);
    if (!activator) {
      return Result.fail(
        this.msg(t, (t) => t.middleware.creatorNotFound(), 'Activator not found')
      );
    }
    if (!activator.isAdmin()) {
      return Result.fail(
        this.msg(
          t,
          (t) => t.middleware.onlyAdmins(),
          'Only administrators can activate users'
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

    // 4. Check if already active
    if (user.isActive()) {
      return Result.fail(
        this.msg(t, (t) => t.admin.user.alreadyActive(), 'User is already active')
      );
    }

    // 5. Activate user
    user.activate();

    // 6. Persist changes
    try {
      await this.userRepository.save(user);
    } catch {
      return Result.fail(this.getError(t, ErrorCode.SAVE_USER_FAILED));
    }

    return Result.ok(undefined);
  }
}
