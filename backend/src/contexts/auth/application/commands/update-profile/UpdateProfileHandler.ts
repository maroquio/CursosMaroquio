import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import {
  ErrorCode,
  getErrorMessage,
  getLocalizedErrorMessage,
} from '@shared/domain/errors/ErrorCodes.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { UpdateProfileCommand } from './UpdateProfileCommand.ts';
import type { UserReadDto } from '../../dtos/index.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';

/**
 * UpdateProfileHandler
 * Handles user profile updates (fullName, phone)
 * Users can only update their own profile
 */
export class UpdateProfileHandler
  implements ICommandHandler<UpdateProfileCommand, UserReadDto>
{
  constructor(private userRepository: IUserRepository) {}

  /**
   * Get error message with i18n support
   */
  private getError(
    t: TranslationFunctions | undefined,
    code: ErrorCode
  ): string {
    return t ? getLocalizedErrorMessage(code, t) : getErrorMessage(code);
  }

  async execute(command: UpdateProfileCommand): Promise<Result<UserReadDto>> {
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

    // 4. Update profile
    user.updateProfile(command.fullName, command.phone);

    // 5. Persist updated user
    try {
      await this.userRepository.save(user);
    } catch {
      return Result.fail(this.getError(t, ErrorCode.SAVE_USER_FAILED));
    }

    // 6. Return updated DTO
    const dto: UserReadDto = {
      id: user.getId().toValue(),
      email: user.getEmail().getValue(),
      fullName: user.getFullName(),
      phone: user.getPhone(),
      photoUrl: user.getPhotoUrl(),
      createdAt: user.getCreatedAt(),
    };

    return Result.ok(dto);
  }
}
