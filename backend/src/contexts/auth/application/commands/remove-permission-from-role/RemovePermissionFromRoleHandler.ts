import { Result } from '@shared/domain/Result.ts';
import type { ICommandHandler } from '@shared/application/ICommandHandler.ts';
import type { RemovePermissionFromRoleCommand } from './RemovePermissionFromRoleCommand.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import type { IRoleRepository } from '../../../domain/repositories/IRoleRepository.ts';
import type { IPermissionRepository } from '../../../domain/repositories/IPermissionRepository.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import { RoleId } from '../../../domain/value-objects/RoleId.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * RemovePermissionFromRoleHandler
 * Handles the RemovePermissionFromRoleCommand to remove a permission from a role
 * Only administrators can remove permissions from roles
 *
 * Supports i18n when command includes translator (command.t)
 */
export class RemovePermissionFromRoleHandler
  implements ICommandHandler<RemovePermissionFromRoleCommand, void>
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

  async execute(command: RemovePermissionFromRoleCommand): Promise<Result<void>> {
    const { t } = command;

    // 1. Validate remover user ID
    const removerIdResult = UserId.createFromString(command.removedByUserId);
    if (removerIdResult.isFailure) {
      return Result.fail(this.msg(t, (t) => t.id.invalidUserId(), 'Invalid remover user ID'));
    }
    const removerId = removerIdResult.getValue();

    // 2. Validate role ID
    const roleIdResult = RoleId.createFromString(command.roleId);
    if (roleIdResult.isFailure) {
      return Result.fail(this.msg(t, (t) => t.id.invalidRoleId(), 'Invalid role ID'));
    }
    const roleId = roleIdResult.getValue();

    // 3. Check if remover is admin
    const remover = await this.userRepository.findById(removerId);
    if (!remover) {
      return Result.fail(this.msg(t, (t) => t.middleware.removerNotFound(), 'Remover not found'));
    }
    if (!remover.isAdmin()) {
      return Result.fail(this.msg(t, (t) => t.middleware.onlyAdmins(), 'Only administrators can remove permissions from roles'));
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

    // 6. Check if role has this permission
    const hasPermission = await this.roleRepository.roleHasPermission(
      roleId,
      permission.name
    );
    if (!hasPermission) {
      return Result.fail(
        this.msg(
          t,
          (t) => t.auth.permission.roleNotHas({ role: role.name, permission: permission.name }),
          `Role '${role.name}' does not have permission '${permission.name}'`
        )
      );
    }

    // 7. Remove permission from role
    await this.roleRepository.removePermissionFromRole(roleId, permission.id);

    return Result.ok<void>(undefined);
  }
}
