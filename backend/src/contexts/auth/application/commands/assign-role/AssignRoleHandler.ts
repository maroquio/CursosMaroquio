import { Result } from '@shared/domain/Result.ts';
import type { ICommandHandler } from '@shared/application/ICommandHandler.ts';
import type { AssignRoleCommand } from './AssignRoleCommand.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import type { IRoleRepository } from '../../../domain/repositories/IRoleRepository.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import { Role } from '../../../domain/value-objects/Role.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * AssignRoleHandler
 * Handles the AssignRoleCommand to assign a role to a user
 * Only administrators can assign roles
 *
 * Supports i18n when command includes translator (command.t)
 */
export class AssignRoleHandler implements ICommandHandler<AssignRoleCommand, void> {
  constructor(
    private userRepository: IUserRepository,
    private roleRepository: IRoleRepository
  ) {}

  /**
   * Get localized message with fallback to English
   */
  private msg(t: TranslationFunctions | undefined, getMessage: (t: TranslationFunctions) => string, fallback: string): string {
    return t ? getMessage(t) : fallback;
  }

  async execute(command: AssignRoleCommand): Promise<Result<void>> {
    const { t } = command;

    // 1. Validate target user ID
    const targetUserIdResult = UserId.createFromString(command.targetUserId);
    if (targetUserIdResult.isFailure) {
      return Result.fail(this.msg(t, (t) => t.id.invalidUserId(), 'Invalid target user ID'));
    }
    const targetUserId = targetUserIdResult.getValue();

    // 2. Validate assigner user ID
    const assignerIdResult = UserId.createFromString(command.assignedByUserId);
    if (assignerIdResult.isFailure) {
      return Result.fail(this.msg(t, (t) => t.id.invalidUserId(), 'Invalid assigner user ID'));
    }
    const assignerId = assignerIdResult.getValue();

    // 3. Validate role
    const roleResult = Role.create(command.roleName, t);
    if (roleResult.isFailure) {
      return Result.fail(roleResult.getError()!);
    }
    const role = roleResult.getValue();

    // 4. Check if assigner is admin
    const assigner = await this.userRepository.findById(assignerId);
    if (!assigner) {
      return Result.fail(this.msg(t, (t) => t.middleware.creatorNotFound(), 'Assigner not found'));
    }
    if (!assigner.isAdmin()) {
      return Result.fail(this.msg(t, (t) => t.middleware.onlyAdmins(), 'Only administrators can assign roles'));
    }

    // 5. Check if target user exists
    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) {
      return Result.fail(this.msg(t, (t) => t.middleware.targetNotFound(), 'Target user not found'));
    }

    // 6. Assign role
    const assignResult = targetUser.assignRole(role, assignerId);
    if (assignResult.isFailure) {
      return assignResult;
    }

    // 7. Persist
    await this.userRepository.save(targetUser);

    // 8. Publish domain events
    const eventPublisher = getDomainEventPublisher();
    await eventPublisher.publishEventsForAggregate(targetUser);

    return Result.ok<void>(undefined);
  }
}
