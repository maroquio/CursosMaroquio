import { Result } from '@shared/domain/Result.ts';
import type { ICommandHandler } from '@shared/application/ICommandHandler.ts';
import type { CreatePermissionCommand } from './CreatePermissionCommand.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import type {
  IPermissionRepository,
  PermissionEntity,
} from '../../../domain/repositories/IPermissionRepository.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import { PermissionId } from '../../../domain/value-objects/PermissionId.ts';
import { Permission } from '../../../domain/value-objects/Permission.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * CreatePermissionHandler
 * Handles the CreatePermissionCommand to create a new permission
 * Only administrators can create permissions
 *
 * Supports i18n when command includes translator (command.t)
 */
export class CreatePermissionHandler
  implements ICommandHandler<CreatePermissionCommand, PermissionEntity>
{
  constructor(
    private userRepository: IUserRepository,
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

  async execute(command: CreatePermissionCommand): Promise<Result<PermissionEntity>> {
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
      return Result.fail(this.msg(t, (t) => t.middleware.onlyAdmins(), 'Only administrators can create permissions'));
    }

    // 3. Validate permission name format (resource:action)
    const permissionResult = Permission.create(command.name);
    if (permissionResult.isFailure) {
      return Result.fail(permissionResult.getError()!);
    }
    const permission = permissionResult.getValue();

    // 4. Check if permission already exists
    const existingPermission = await this.permissionRepository.existsByName(
      permission.getValue()
    );
    if (existingPermission) {
      return Result.fail(
        this.msg(
          t,
          (t) => t.auth.permission.alreadyExists({ permission: permission.getValue() }),
          `Permission '${permission.getValue()}' already exists`
        )
      );
    }

    // 5. Create permission entity
    const permissionId = PermissionId.create();
    const now = new Date();
    const permissionEntity: PermissionEntity = {
      id: permissionId,
      name: permission.getValue(),
      resource: permission.getResource(),
      action: permission.getAction(),
      description: command.description,
      createdAt: now,
    };

    // 6. Save permission
    await this.permissionRepository.save(permissionEntity);

    return Result.ok(permissionEntity);
  }
}
