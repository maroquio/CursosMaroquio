import { Result } from '@shared/domain/Result.ts';
import type { ICommandHandler } from '@shared/application/ICommandHandler.ts';
import type { RemovePermissionFromUserCommand } from './RemovePermissionFromUserCommand.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import type { IPermissionRepository } from '../../../domain/repositories/IPermissionRepository.ts';
import type { IPermissionService } from '../../../domain/services/IPermissionService.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

/**
 * RemovePermissionFromUserHandler
 * Handles the RemovePermissionFromUserCommand to remove an individual permission from a user
 * Only administrators can remove permissions from users
 *
 * Supports i18n when command includes translator (command.t)
 */
export class RemovePermissionFromUserHandler
  implements ICommandHandler<RemovePermissionFromUserCommand, void>
{
  constructor(
    private userRepository: IUserRepository,
    private permissionRepository: IPermissionRepository,
    private permissionService: IPermissionService
  ) {}

  /**
   * Get localized message with fallback to English
   */
  private msg(
    t: TranslationFunctions | undefined,
    getMessage: (t: TranslationFunctions) => string,
    fallback: string
  ): string {
    return t ? getMessage(t) : fallback;
  }

  async execute(command: RemovePermissionFromUserCommand): Promise<Result<void>> {
    const { t } = command;

    // 1. Validate remover user ID
    const removerIdResult = UserId.createFromString(command.removedByUserId);
    if (removerIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_USER_ID);
    }
    const removerId = removerIdResult.getValue();

    // 2. Validate target user ID
    const targetUserIdResult = UserId.createFromString(command.targetUserId);
    if (targetUserIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_USER_ID);
    }
    const targetUserId = targetUserIdResult.getValue();

    // 3. Check if remover is admin
    const remover = await this.userRepository.findById(removerId);
    if (!remover) {
      return Result.fail(ErrorCode.USER_NOT_FOUND);
    }
    if (!remover.isAdmin()) {
      return Result.fail(this.msg(t, (t) => t.middleware.onlyAdmins(), 'Only administrators can remove permissions from users'));
    }

    // 4. Check if target user exists
    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) {
      return Result.fail(ErrorCode.USER_NOT_FOUND);
    }

    // 5. Check if permission exists
    const permission = await this.permissionRepository.findByName(
      command.permissionName.toLowerCase()
    );
    if (!permission) {
      return Result.fail(
        this.msg(
          t,
          (t) => t.auth.permission.notFound({ permission: command.permissionName }),
          `Permission '${command.permissionName}' not found`
        )
      );
    }

    // 6. Check if user has this individual permission
    const hasPermission = await this.permissionRepository.userHasPermission(
      targetUserId,
      permission.name
    );
    if (!hasPermission) {
      return Result.fail(ErrorCode.USER_DOES_NOT_HAVE_PERMISSION);
    }

    // 7. Remove permission from user
    await this.permissionRepository.removeFromUser(permission.id, targetUserId);

    // 8. Invalidate permission cache for the user
    await this.permissionService.invalidateUserPermissions(targetUserId);

    return Result.ok<void>(undefined);
  }
}
