import { Result } from '@shared/domain/Result.ts';
import type { ICommandHandler } from '@shared/application/ICommandHandler.ts';
import type { CreateRoleCommand } from './CreateRoleCommand.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import type { IRoleRepository, RoleEntity } from '../../../domain/repositories/IRoleRepository.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import { RoleId } from '../../../domain/value-objects/RoleId.ts';
import { Role } from '../../../domain/value-objects/Role.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { RoleCreated } from '../../../domain/events/RoleCreated.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * Result type for CreateRoleCommand
 * Returns only the role ID following CQRS pattern (commands don't return entities)
 */
export interface CreateRoleResult {
  roleId: string;
}

/**
 * CreateRoleHandler
 * Handles the CreateRoleCommand to create a new role
 * Only administrators can create roles
 *
 * Supports i18n when command includes translator (command.t)
 */
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand, CreateRoleResult> {
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

  async execute(command: CreateRoleCommand): Promise<Result<CreateRoleResult>> {
    const { t } = command;

    // 1. Validate creator user ID
    const creatorIdResult = UserId.createFromString(command.createdByUserId);
    if (creatorIdResult.isFailure) {
      return Result.fail(this.msg(t, (t) => t.id.invalidUserId(), 'Invalid creator user ID'));
    }
    const creatorId = creatorIdResult.getValue();

    // 2. Check if creator is admin
    const creator = await this.userRepository.findById(creatorId);
    if (!creator) {
      return Result.fail(this.msg(t, (t) => t.middleware.creatorNotFound(), 'Creator not found'));
    }
    if (!creator.isAdmin()) {
      return Result.fail(this.msg(t, (t) => t.middleware.onlyAdmins(), 'Only administrators can create roles'));
    }

    // 3. Validate role name format
    const roleResult = Role.create(command.name, t);
    if (roleResult.isFailure) {
      return Result.fail(roleResult.getError()!);
    }
    const roleName = roleResult.getValue().getValue();

    // 4. Check if role already exists
    const existingRole = await this.roleRepository.existsByName(roleName);
    if (existingRole) {
      return Result.fail(this.msg(t, (t) => t.auth.role.alreadyExists({ name: roleName }), `Role '${roleName}' already exists`));
    }

    // 5. Create role entity
    const roleId = RoleId.create();
    const now = new Date();
    const roleEntity: RoleEntity = {
      id: roleId,
      name: roleName,
      description: command.description,
      isSystem: false, // User-created roles are never system roles
      createdAt: now,
      updatedAt: null,
    };

    // 6. Save role
    await this.roleRepository.save(roleEntity);

    // 7. Publish domain event
    const eventPublisher = getDomainEventPublisher();
    const event = new RoleCreated(roleId, roleName, command.description, creatorId);
    await eventPublisher.publish(event);

    // Return only the role ID (CQRS pattern: commands don't return full entities)
    return Result.ok({ roleId: roleId.toValue() });
  }
}
