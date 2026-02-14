import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode, getErrorMessage, getLocalizedErrorMessage } from '@shared/domain/errors/ErrorCodes.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { GetUserPermissionsQuery } from './GetUserPermissionsQuery.ts';
import type { IPermissionService } from '../../../domain/services/IPermissionService.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';

/**
 * UserPermissionsDto
 * Response DTO for user permissions query
 */
export interface UserPermissionsDto {
  userId: string;
  permissions: string[];
  roles: string[];
}

/**
 * GetUserPermissionsHandler
 * Handles queries to get all effective permissions for a user
 * Returns the combined permissions from all roles + individual permissions
 */
export class GetUserPermissionsHandler
  implements IQueryHandler<GetUserPermissionsQuery, UserPermissionsDto>
{
  constructor(
    private userRepository: IUserRepository,
    private permissionService: IPermissionService
  ) {}

  /**
   * Get localized error message with fallback
   */
  private getError(t: TranslationFunctions | undefined, code: ErrorCode): string {
    return t ? getLocalizedErrorMessage(code, t) : getErrorMessage(code);
  }

  async execute(
    query: GetUserPermissionsQuery
  ): Promise<Result<UserPermissionsDto>> {
    // 1. Validate user ID
    const userIdResult = UserId.createFromString(query.userId);
    if (userIdResult.isFailure) {
      return Result.fail(this.getError(query.t, ErrorCode.INVALID_USER_ID));
    }
    const userId = userIdResult.getValue();

    // 2. Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.fail(this.getError(query.t, ErrorCode.USER_NOT_FOUND));
    }

    // 3. Get effective permissions
    const permissionNames =
      await this.permissionService.getEffectivePermissionNames(userId);

    // 4. Get user roles
    const roleNames = user.getRoleNames();

    // 5. Build response
    const response: UserPermissionsDto = {
      userId: userId.toValue(),
      permissions: permissionNames,
      roles: roleNames,
    };

    return Result.ok(response);
  }
}
