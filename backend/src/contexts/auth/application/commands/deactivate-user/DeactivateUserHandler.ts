import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import {
  ErrorCode,
  getErrorMessage,
  getLocalizedErrorMessage,
} from '@shared/domain/errors/ErrorCodes.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { DeactivateUserCommand } from './DeactivateUserCommand.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';

/**
 * DeactivateUserHandler
 * Handles user deactivation (soft delete)
 * Admins cannot deactivate themselves
 */
export class DeactivateUserHandler
  implements ICommandHandler<DeactivateUserCommand>
{
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

  async execute(command: DeactivateUserCommand): Promise<Result<void>> {
    const { t } = command;

    // 1. Validate deactivator is admin
    const deactivatorIdResult = UserId.createFromString(
      command.deactivatedByUserId
    );
    if (deactivatorIdResult.isFailure) {
      return Result.fail(this.getError(t, ErrorCode.INVALID_USER_ID));
    }
    const deactivatorId = deactivatorIdResult.getValue();

    const deactivator = await this.userRepository.findById(deactivatorId);
    if (!deactivator) {
      return Result.fail(
        this.msg(
          t,
          (t) => t.middleware.creatorNotFound(),
          'Deactivator not found'
        )
      );
    }
    if (!deactivator.isAdmin()) {
      return Result.fail(
        this.msg(
          t,
          (t) => t.middleware.onlyAdmins(),
          'Only administrators can deactivate users'
        )
      );
    }

    // 2. Validate target user ID
    const userIdResult = UserId.createFromString(command.userId);
    if (userIdResult.isFailure) {
      return Result.fail(this.getError(t, ErrorCode.INVALID_USER_ID));
    }
    const userId = userIdResult.getValue();

    // 3. Prevent self-deactivation
    if (deactivatorId.equals(userId)) {
      return Result.fail(
        this.msg(
          t,
          (t) => t.admin.user.cannotDeactivateSelf(),
          'Cannot deactivate your own account'
        )
      );
    }

    // 4. Find target user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.fail(this.getError(t, ErrorCode.USER_NOT_FOUND));
    }

    // 5. Check if already inactive
    if (!user.isActive()) {
      return Result.fail(
        this.msg(t, (t) => t.admin.user.alreadyInactive(), 'User is already inactive')
      );
    }

    // 6. Deactivate user
    user.deactivate();

    // 7. Persist changes
    try {
      await this.userRepository.save(user);
    } catch {
      return Result.fail(this.getError(t, ErrorCode.SAVE_USER_FAILED));
    }

    return Result.ok(undefined);
  }
}
