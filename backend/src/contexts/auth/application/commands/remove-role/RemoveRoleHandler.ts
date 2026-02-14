import { Result } from '@shared/domain/Result.ts';
import type { ICommandHandler } from '@shared/application/ICommandHandler.ts';
import type { RemoveRoleCommand } from './RemoveRoleCommand.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import { Role } from '../../../domain/value-objects/Role.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * RemoveRoleHandler
 * Handles the RemoveRoleCommand to remove a role from a user
 * Only administrators can remove roles
 * Admins cannot remove their own admin role
 *
 * Supports i18n when command includes translator (command.t)
 */
export class RemoveRoleHandler implements ICommandHandler<RemoveRoleCommand, void> {
  constructor(private userRepository: IUserRepository) {}

  /**
   * Get localized message with fallback to English
   */
  private msg(t: TranslationFunctions | undefined, getMessage: (t: TranslationFunctions) => string, fallback: string): string {
    return t ? getMessage(t) : fallback;
  }

  async execute(command: RemoveRoleCommand): Promise<Result<void>> {
    const { t } = command;

    // 1. Validate target user ID
    const targetUserIdResult = UserId.createFromString(command.targetUserId);
    if (targetUserIdResult.isFailure) {
      return Result.fail(this.msg(t, (t) => t.id.invalidUserId(), 'Invalid target user ID'));
    }
    const targetUserId = targetUserIdResult.getValue();

    // 2. Validate remover user ID
    const removerIdResult = UserId.createFromString(command.removedByUserId);
    if (removerIdResult.isFailure) {
      return Result.fail(this.msg(t, (t) => t.id.invalidUserId(), 'Invalid remover user ID'));
    }
    const removerId = removerIdResult.getValue();

    // 3. Validate role
    const roleResult = Role.create(command.roleName, t);
    if (roleResult.isFailure) {
      return Result.fail(roleResult.getError()!);
    }
    const role = roleResult.getValue();

    // 4. Check if remover is admin
    const remover = await this.userRepository.findById(removerId);
    if (!remover) {
      return Result.fail(this.msg(t, (t) => t.middleware.creatorNotFound(), 'Remover not found'));
    }
    if (!remover.isAdmin()) {
      return Result.fail(this.msg(t, (t) => t.middleware.onlyAdmins(), 'Only administrators can remove roles'));
    }

    // 5. Prevent admin from removing their own admin role
    if (targetUserId.equals(removerId) && role.isAdmin()) {
      return Result.fail(this.msg(t, (t) => t.middleware.cannotRemoveOwnRole(), 'Cannot remove your own admin role'));
    }

    // 6. Check if target user exists
    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) {
      return Result.fail(this.msg(t, (t) => t.middleware.targetNotFound(), 'Target user not found'));
    }

    // 7. Remove role
    const removeResult = targetUser.removeRole(role, removerId);
    if (removeResult.isFailure) {
      return removeResult;
    }

    // 8. Persist
    await this.userRepository.save(targetUser);

    // 9. Publish domain events
    const eventPublisher = getDomainEventPublisher();
    await eventPublisher.publishEventsForAggregate(targetUser);

    return Result.ok<void>(undefined);
  }
}
