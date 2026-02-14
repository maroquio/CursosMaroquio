import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import {
  ErrorCode,
  getErrorMessage,
  getLocalizedErrorMessage,
} from '@shared/domain/errors/ErrorCodes.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { UpdateUserAdminCommand } from './UpdateUserAdminCommand.ts';
import type { UserAdminReadDto } from '../../dtos/index.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import { Email } from '../../../domain/value-objects/Email.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';

/**
 * UpdateUserAdminHandler
 * Handles admin user updates (email change)
 * Only administrators can update users via this handler
 */
export class UpdateUserAdminHandler
  implements ICommandHandler<UpdateUserAdminCommand, UserAdminReadDto>
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

  async execute(
    command: UpdateUserAdminCommand
  ): Promise<Result<UserAdminReadDto>> {
    const { t } = command;

    // 1. Validate updater is admin
    const updaterIdResult = UserId.createFromString(command.updatedByUserId);
    if (updaterIdResult.isFailure) {
      return Result.fail(this.getError(t, ErrorCode.INVALID_USER_ID));
    }
    const updaterId = updaterIdResult.getValue();

    const updater = await this.userRepository.findById(updaterId);
    if (!updater) {
      return Result.fail(
        this.msg(t, (t) => t.middleware.creatorNotFound(), 'Updater not found')
      );
    }
    if (!updater.isAdmin()) {
      return Result.fail(
        this.msg(
          t,
          (t) => t.middleware.onlyAdmins(),
          'Only administrators can update users'
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

    // 4. Update email if provided
    if (command.email !== undefined) {
      const emailOrError = Email.create(command.email, { t });
      if (emailOrError.isFailure) {
        return Result.fail(emailOrError.getError() as string);
      }
      const newEmail = emailOrError.getValue();

      // Check if email is different
      if (!user.getEmail().equals(newEmail)) {
        // Check if new email is already in use
        const emailExists = await this.userRepository.existsByEmail(newEmail);
        if (emailExists) {
          return Result.fail(this.getError(t, ErrorCode.USER_ALREADY_EXISTS));
        }

        // Update email on the user
        user.updateEmail(newEmail);
      }
    }

    // 5. Persist updated user
    try {
      await this.userRepository.save(user);
    } catch {
      return Result.fail(this.getError(t, ErrorCode.SAVE_USER_FAILED));
    }

    // 6. Return updated DTO
    const dto: UserAdminReadDto = {
      id: user.getId().toValue(),
      email: user.getEmail().getValue(),
      fullName: user.getFullName(),
      phone: user.getPhone(),
      photoUrl: user.getPhotoUrl(),
      isActive: user.isActive(),
      roles: user.getRoles().map((r) => r.getValue()),
      individualPermissions: user
        .getIndividualPermissions()
        .map((p) => p.getValue()),
      createdAt: user.getCreatedAt().toISOString(),
    };

    return Result.ok(dto);
  }
}
