import { Result } from '@shared/domain/Result.ts';
import type { ICommandHandler } from '@shared/application/ICommandHandler.ts';
import type { AssignPermissionToRoleCommand } from './AssignPermissionToRoleCommand.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import type { IRoleRepository } from '../../../domain/repositories/IRoleRepository.ts';
import type { IPermissionRepository } from '../../../domain/repositories/IPermissionRepository.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import { RoleId } from '../../../domain/value-objects/RoleId.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * AssignPermissionToRoleHandler
 * Handles the AssignPermissionToRoleCommand to assign a permission to a role
 * Only administrators can assign permissions to roles
 *
 * Supports i18n when command includes translator (command.t)
 */
export class AssignPermissionToRoleHandler
  implements ICommandHandler<AssignPermissionToRoleCommand, void>
{
  constructor(
    private userRepository: IUserRepository,
    private roleRepository: IRoleRepository,
    private permissionRepository: IPermissionRepository
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

  async execute(command: AssignPermissionToRoleCommand): Promise<Result<void>> {
    const { t } = command;

    // 1. Validate assigner user ID
    const assignerIdResult = UserId.createFromString(command.assignedByUserId);
    if (assignerIdResult.isFailure) {
      return Result.fail(this.msg(t, (t) => t.id.invalidUserId(), 'Invalid assigner user ID'));
    }
    const assignerId = assignerIdResult.getValue();

    // 2. Validate role ID
    const roleIdResult = RoleId.createFromString(command.roleId);
    if (roleIdResult.isFailure) {
      return Result.fail(this.msg(t, (t) => t.id.invalidRoleId(), 'Invalid role ID'));
    }
    const roleId = roleIdResult.getValue();

    // 3. Check if assigner is admin
    const assigner = await this.userRepository.findById(assignerId);
    if (!assigner) {
      return Result.fail(this.msg(t, (t) => t.middleware.assignerNotFound(), 'Assigner not found'));
    }
    if (!assigner.isAdmin()) {
      return Result.fail(this.msg(t, (t) => t.middleware.onlyAdmins(), 'Only administrators can assign permissions to roles'));
    }

    // 4. Check if role exists
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      return Result.fail(this.msg(t, (t) => t.auth.role.notFound(), 'Role not found'));
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

    // 6. Check if role already has this permission
    const hasPermission = await this.roleRepository.roleHasPermission(
      roleId,
      permission.name
    );
    if (hasPermission) {
      return Result.fail(
        this.msg(
          t,
          (t) => t.auth.permission.roleAlreadyHas({ role: role.name, permission: permission.name }),
          `Role '${role.name}' already has permission '${permission.name}'`
        )
      );
    }

    // 7. Assign permission to role
    await this.roleRepository.assignPermissionToRole(
      roleId,
      permission.id,
      assignerId
    );

    return Result.ok<void>(undefined);
  }
}
