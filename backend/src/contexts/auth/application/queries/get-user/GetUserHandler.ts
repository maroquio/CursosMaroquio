import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode, getErrorMessage, getLocalizedErrorMessage } from '@shared/domain/errors/ErrorCodes.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { GetUserQuery } from './GetUserQuery.ts';
import { type UserReadDto } from '../../../application/dtos/UserReadDto.ts';
import { type IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';

/**
 * GetUserHandler
 * Handles user retrieval queries
 * Returns a read model (DTO) optimized for display
 */
export class GetUserHandler implements IQueryHandler<GetUserQuery, UserReadDto> {
  constructor(private userRepository: IUserRepository) {}

  /**
   * Get localized error message with fallback
   */
  private getError(t: TranslationFunctions | undefined, code: ErrorCode): string {
    return t ? getLocalizedErrorMessage(code, t) : getErrorMessage(code);
  }

  async execute(query: GetUserQuery): Promise<Result<UserReadDto>> {
    // Validate and create UserId
    const userIdOrError = UserId.createFromString(query.userId);
    if (userIdOrError.isFailure) {
      return Result.fail(this.getError(query.t, ErrorCode.INVALID_USER_ID));
    }
    const userId = userIdOrError.getValue();

    // Find user in repository
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.fail(this.getError(query.t, ErrorCode.USER_NOT_FOUND));
    }

    // Map entity to read model (DTO)
    const readDto: UserReadDto = {
      id: user.getId().toValue(),
      email: user.getEmail().getValue(),
      fullName: user.getFullName(),
      phone: user.getPhone(),
      photoUrl: user.getPhotoUrl(),
      createdAt: user.getCreatedAt(),
    };

    return Result.ok(readDto);
  }
}
