import { Result } from '@shared/domain/Result.ts';
import type { ICommandHandler } from '@shared/application/ICommandHandler.ts';
import type { AssignPermissionToUserCommand } from './AssignPermissionToUserCommand.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import type { IPermissionRepository } from '../../../domain/repositories/IPermissionRepository.ts';
import type { IPermissionService } from '../../../domain/services/IPermissionService.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * AssignPermissionToUserHandler
 * Handles the AssignPermissionToUserCommand to assign a permission directly to a user
 * Only administrators can assign permissions to users
 *
 * Supports i18n when command includes translator (command.t)
 */
export class AssignPermissionToUserHandler
  implements ICommandHandler<AssignPermissionToUserCommand, void>
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

  async execute(command: AssignPermissionToUserCommand): Promise<Result<void>> {
    const { t } = command;

    // 1. Validate assigner user ID
    const assignerIdResult = UserId.createFromString(command.assignedByUserId);
    if (assignerIdResult.isFailure) {
      return Result.fail(this.msg(t, (t) => t.id.invalidUserId(), 'Invalid assigner user ID'));
    }
    const assignerId = assignerIdResult.getValue();

    // 2. Validate target user ID
    const targetUserIdResult = UserId.createFromString(command.targetUserId);
    if (targetUserIdResult.isFailure) {
      return Result.fail(this.msg(t, (t) => t.id.invalidUserId(), 'Invalid target user ID'));
    }
    const targetUserId = targetUserIdResult.getValue();

    // 3. Check if assigner is admin
    const assigner = await this.userRepository.findById(assignerId);
    if (!assigner) {
      return Result.fail(this.msg(t, (t) => t.middleware.assignerNotFound(), 'Assigner not found'));
    }
    if (!assigner.isAdmin()) {
      return Result.fail(this.msg(t, (t) => t.middleware.onlyAdmins(), 'Only administrators can assign permissions to users'));
    }

    // 4. Check if target user exists
    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) {
      return Result.fail(this.msg(t, (t) => t.middleware.targetNotFound(), 'Target user not found'));
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

    // 6. Check if user already has this permission (either individual or from role)
    const alreadyHas = await this.permissionRepository.userHasPermission(
      targetUserId,
      permission.name
    );
    if (alreadyHas) {
      return Result.fail(
        this.msg(
          t,
          (t) => t.auth.permission.userAlreadyHas({ permission: permission.name }),
          `User already has individual permission '${permission.name}'`
        )
      );
    }

    // 7. Assign permission to user
    await this.permissionRepository.assignToUser(
      permission.id,
      targetUserId,
      assignerId
    );

    // 8. Invalidate permission cache for the user
    await this.permissionService.invalidateUserPermissions(targetUserId);

    return Result.ok<void>(undefined);
  }
}
