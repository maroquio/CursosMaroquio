import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import {
  ErrorCode,
  getErrorMessage,
  getLocalizedErrorMessage,
} from '@shared/domain/errors/ErrorCodes.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { CreateUserAdminCommand } from './CreateUserAdminCommand.ts';
import type { UserAdminReadDto } from '../../dtos/index.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import type { IRoleRepository } from '../../../domain/repositories/IRoleRepository.ts';
import type { IPasswordHasher } from '../../../domain/services/IPasswordHasher.ts';
import { Email } from '../../../domain/value-objects/Email.ts';
import { Password } from '../../../domain/value-objects/Password.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import { Role } from '../../../domain/value-objects/Role.ts';
import { User } from '../../../domain/entities/User.ts';

/**
 * CreateUserAdminHandler
 * Handles admin user creation with role assignment
 * Only administrators can create users via this handler
 */
export class CreateUserAdminHandler
  implements ICommandHandler<CreateUserAdminCommand, UserAdminReadDto>
{
  constructor(
    private userRepository: IUserRepository,
    private roleRepository: IRoleRepository,
    private passwordHasher: IPasswordHasher
  ) {}

  /**
   * Get localized message with fallback
   */
  private msg(
    t: TranslationFunctions | undefined,
    getMessage: (t: TranslationFunctions) => string,
    fallback: string
  ): string {
    return t ? getMessage(t) : fallback;
  }

  /**
   * Get error message with i18n support
   */
  private getError(
    t: TranslationFunctions | undefined,
    code: ErrorCode
  ): string {
    return t ? getLocalizedErrorMessage(code, t) : getErrorMessage(code);
  }

  async execute(
    command: CreateUserAdminCommand
  ): Promise<Result<UserAdminReadDto>> {
    const { t } = command;

    // 1. Validate creator is admin
    const creatorIdResult = UserId.createFromString(command.createdByUserId);
    if (creatorIdResult.isFailure) {
      return Result.fail(this.getError(t, ErrorCode.INVALID_USER_ID));
    }
    const creatorId = creatorIdResult.getValue();

    const creator = await this.userRepository.findById(creatorId);
    if (!creator) {
      return Result.fail(
        this.msg(t, (t) => t.middleware.creatorNotFound(), 'Creator not found')
      );
    }
    if (!creator.isAdmin()) {
      return Result.fail(
        this.msg(
          t,
          (t) => t.middleware.onlyAdmins(),
          'Only administrators can create users'
        )
      );
    }

    // 2. Validate and create Email value object
    const emailOrError = Email.create(command.email, { t });
    if (emailOrError.isFailure) {
      return Result.fail(emailOrError.getError() as string);
    }
    const email = emailOrError.getValue();

    // 3. Check if user already exists
    const userExists = await this.userRepository.existsByEmail(email);
    if (userExists) {
      return Result.fail(this.getError(t, ErrorCode.USER_ALREADY_EXISTS));
    }

    // 4. Hash password
    let hashedPassword: string;
    try {
      hashedPassword = await this.passwordHasher.hash(command.password);
    } catch {
      return Result.fail(this.getError(t, ErrorCode.PASSWORD_HASH_FAILED));
    }

    // 5. Create Password value object
    const passwordOrError = Password.create(hashedPassword);
    if (passwordOrError.isFailure) {
      return Result.fail(passwordOrError.getError() as string);
    }
    const password = passwordOrError.getValue();

    // 6. Validate and create Role value objects
    const roles: Role[] = [];
    for (const roleName of command.roles) {
      const roleResult = Role.create(roleName, t);
      if (roleResult.isFailure) {
        return Result.fail(roleResult.getError()!);
      }
      const role = roleResult.getValue();

      // Verify role exists in database
      const roleExists = await this.roleRepository.existsByName(role.getValue());
      if (!roleExists) {
        return Result.fail(
          this.msg(
            t,
            (t) => t.auth.role.notFound(),
            `Role '${roleName}' not found`
          )
        );
      }
      roles.push(role);
    }

    // 7. Create User aggregate with roles and isActive
    const userOrError = User.create(email, password, command.fullName, command.phone, roles, command.isActive);
    if (userOrError.isFailure) {
      return Result.fail(userOrError.getError() as string);
    }
    const user = userOrError.getValue();

    // 8. Persist user
    try {
      await this.userRepository.save(user);
    } catch {
      return Result.fail(this.getError(t, ErrorCode.SAVE_USER_FAILED));
    }

    // 9. Publish domain events
    const eventPublisher = getDomainEventPublisher();
    await eventPublisher.publishEventsForAggregate(user);

    // 10. Return DTO
    const dto: UserAdminReadDto = {
      id: user.getId().toValue(),
      email: user.getEmail().getValue(),
      fullName: user.getFullName(),
      phone: user.getPhone(),
      photoUrl: user.getPhotoUrl(),
      isActive: user.isActive(),
      roles: user.getRoles().map((r) => r.getValue()),
      individualPermissions: user
        .getIndividualPermissions()
        .map((p) => p.getValue()),
      createdAt: user.getCreatedAt().toISOString(),
    };

    return Result.ok(dto);
  }
}
