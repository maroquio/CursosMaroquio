import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import {
  ErrorCode,
  getErrorMessage,
  getLocalizedErrorMessage,
} from '@shared/domain/errors/ErrorCodes.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { GetUserAdminQuery } from './GetUserAdminQuery.ts';
import type { UserAdminReadDto } from '../../dtos/index.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';

/**
 * GetUserAdminHandler
 * Handles admin user retrieval queries
 * Returns a complete user DTO including roles and permissions
 */
export class GetUserAdminHandler
  implements IQueryHandler<GetUserAdminQuery, UserAdminReadDto>
{
  constructor(private userRepository: IUserRepository) {}

  /**
   * Get localized error message with fallback
   */
  private getError(t: TranslationFunctions | undefined, code: ErrorCode): string {
    return t ? getLocalizedErrorMessage(code, t) : getErrorMessage(code);
  }

  async execute(query: GetUserAdminQuery): Promise<Result<UserAdminReadDto>> {
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

    // Map entity to admin read DTO
    const dto: UserAdminReadDto = {
      id: user.getId().toValue(),
      email: user.getEmail().getValue(),
      fullName: user.getFullName(),
      phone: user.getPhone(),
      photoUrl: user.getPhotoUrl(),
      isActive: user.isActive(),
      roles: user.getRoles().map((role) => role.getValue()),
      individualPermissions: user
        .getIndividualPermissions()
        .map((perm) => perm.getValue()),
      createdAt: user.getCreatedAt().toISOString(),
    };

    return Result.ok(dto);
  }
}
