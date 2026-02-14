import { Result } from '@shared/domain/Result.ts';
import type { ICommandHandler } from '@shared/application/ICommandHandler.ts';
import type { DeleteRoleCommand } from './DeleteRoleCommand.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import type { IRoleRepository } from '../../../domain/repositories/IRoleRepository.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import { RoleId } from '../../../domain/value-objects/RoleId.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { RoleDeleted } from '../../../domain/events/RoleDeleted.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * DeleteRoleHandler
 * Handles the DeleteRoleCommand to delete a role
 * Only administrators can delete roles
 * System roles cannot be deleted
 *
 * Supports i18n when command includes translator (command.t)
 */
export class DeleteRoleHandler implements ICommandHandler<DeleteRoleCommand, void> {
  constructor(
    private userRepository: IUserRepository,
    private roleRepository: IRoleRepository
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

  async execute(command: DeleteRoleCommand): Promise<Result<void>> {
    const { t } = command;

    // 1. Validate deleter user ID
    const deleterIdResult = UserId.createFromString(command.deletedByUserId);
    if (deleterIdResult.isFailure) {
      return Result.fail(this.msg(t, (t) => t.id.invalidUserId(), 'Invalid deleter user ID'));
    }
    const deleterId = deleterIdResult.getValue();

    // 2. Validate role ID
    const roleIdResult = RoleId.createFromString(command.roleId);
    if (roleIdResult.isFailure) {
      return Result.fail(this.msg(t, (t) => t.id.invalidRoleId(), 'Invalid role ID'));
    }
    const roleId = roleIdResult.getValue();

    // 3. Check if deleter is admin
    const deleter = await this.userRepository.findById(deleterId);
    if (!deleter) {
      return Result.fail(this.msg(t, (t) => t.middleware.deleterNotFound(), 'Deleter not found'));
    }
    if (!deleter.isAdmin()) {
      return Result.fail(this.msg(t, (t) => t.middleware.onlyAdmins(), 'Only administrators can delete roles'));
    }

    // 4. Find role
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      return Result.fail(this.msg(t, (t) => t.auth.role.notFound(), 'Role not found'));
    }

    // 5. Check if it's a system role
    if (role.isSystem) {
      return Result.fail(this.msg(t, (t) => t.auth.role.cannotDeleteSystem(), 'System roles cannot be deleted'));
    }

    // 6. Store role name for the event before deletion
    const roleName = role.name;

    // 7. Delete role (cascade will remove role-permission and user-role assignments)
    await this.roleRepository.delete(roleId);

    // 8. Publish domain event
    const eventPublisher = getDomainEventPublisher();
    const event = new RoleDeleted(roleId, roleName, deleterId);
    await eventPublisher.publish(event);

    return Result.ok<void>(undefined);
  }
}
