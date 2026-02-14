import { Result } from '@shared/domain/Result.ts';
import type { ICommandHandler } from '@shared/application/ICommandHandler.ts';
import type { UpdateRoleCommand } from './UpdateRoleCommand.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import type { IRoleRepository, RoleEntity } from '../../../domain/repositories/IRoleRepository.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import { RoleId } from '../../../domain/value-objects/RoleId.ts';
import { Role } from '../../../domain/value-objects/Role.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { RoleUpdated } from '../../../domain/events/RoleUpdated.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * UpdateRoleHandler
 * Handles the UpdateRoleCommand to update an existing role
 * Only administrators can update roles
 * System roles cannot be renamed
 *
 * Supports i18n when command includes translator (command.t)
 */
export class UpdateRoleHandler implements ICommandHandler<UpdateRoleCommand, RoleEntity> {
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

  async execute(command: UpdateRoleCommand): Promise<Result<RoleEntity>> {
    const { t } = command;

    // 1. Validate updater user ID
    const updaterIdResult = UserId.createFromString(command.updatedByUserId);
    if (updaterIdResult.isFailure) {
      return Result.fail(this.msg(t, (t) => t.id.invalidUserId(), 'Invalid updater user ID'));
    }
    const updaterId = updaterIdResult.getValue();

    // 2. Validate role ID
    const roleIdResult = RoleId.createFromString(command.roleId);
    if (roleIdResult.isFailure) {
      return Result.fail(this.msg(t, (t) => t.id.invalidRoleId(), 'Invalid role ID'));
    }
    const roleId = roleIdResult.getValue();

    // 3. Check if updater is admin
    const updater = await this.userRepository.findById(updaterId);
    if (!updater) {
      return Result.fail(this.msg(t, (t) => t.middleware.creatorNotFound(), 'Updater not found'));
    }
    if (!updater.isAdmin()) {
      return Result.fail(this.msg(t, (t) => t.middleware.onlyAdmins(), 'Only administrators can update roles'));
    }

    // 4. Find existing role
    const existingRole = await this.roleRepository.findById(roleId);
    if (!existingRole) {
      return Result.fail(this.msg(t, (t) => t.auth.role.notFound(), 'Role not found'));
    }

    // 5. Prepare updated values
    let newName = existingRole.name;
    let nameChanged = false;

    // If a new name is provided, validate and check for conflicts
    if (command.name !== null && command.name !== existingRole.name) {
      // System roles cannot be renamed
      if (existingRole.isSystem) {
        return Result.fail(this.msg(t, (t) => t.auth.role.cannotRenameSystem(), 'System roles cannot be renamed'));
      }

      // Validate new name format
      const roleResult = Role.create(command.name, t);
      if (roleResult.isFailure) {
        return Result.fail(roleResult.getError()!);
      }
      newName = roleResult.getValue().getValue();

      // Check if new name already exists
      const nameExists = await this.roleRepository.existsByName(newName);
      if (nameExists) {
        return Result.fail(this.msg(t, (t) => t.auth.role.alreadyExists({ name: newName }), `Role '${newName}' already exists`));
      }

      nameChanged = true;
    }

    // 6. Create updated role entity
    const updatedRole: RoleEntity = {
      id: existingRole.id,
      name: newName,
      description: command.description !== null ? command.description : existingRole.description,
      isSystem: existingRole.isSystem,
      createdAt: existingRole.createdAt,
      updatedAt: new Date(),
    };

    // 7. Save updated role
    await this.roleRepository.update(updatedRole);

    // 8. Publish domain event
    const eventPublisher = getDomainEventPublisher();
    const event = new RoleUpdated(
      roleId,
      nameChanged ? newName : undefined,
      command.description !== null && command.description !== existingRole.description
        ? command.description
        : undefined,
      updaterId
    );
    await eventPublisher.publish(event);

    return Result.ok(updatedRole);
  }
}
