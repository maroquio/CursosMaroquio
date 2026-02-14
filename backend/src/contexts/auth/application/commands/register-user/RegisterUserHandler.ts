import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import {
  ErrorCode,
  getErrorMessage,
  getLocalizedErrorMessage,
} from '@shared/domain/errors/ErrorCodes.ts';
import { RegisterUserCommand } from './RegisterUserCommand.ts';
import { type IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import { type IPasswordHasher } from '../../../domain/services/IPasswordHasher.ts';
import { Email } from '../../../domain/value-objects/Email.ts';
import { Password } from '../../../domain/value-objects/Password.ts';
import { User } from '../../../domain/entities/User.ts';

/**
 * RegisterUserHandler
 * Handles user registration with the following steps:
 * 1. Validate input and create value objects
 * 2. Check if user already exists
 * 3. Create User aggregate
 * 4. Persist user
 * 5. Publish domain events
 * 6. Return result
 *
 * Supports i18n when command includes translator (command.t)
 */
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher
  ) {}

  /**
   * Get error message with i18n support
   */
  private getError(command: RegisterUserCommand, code: ErrorCode): string {
    return command.t ? getLocalizedErrorMessage(code, command.t) : getErrorMessage(code);
  }

  async execute(command: RegisterUserCommand): Promise<Result<void>> {
    // Step 1: Create Email value object and validate
    const emailOrError = Email.create(command.email, { t: command.t });
    if (emailOrError.isFailure) {
      return Result.fail(emailOrError.getError() as string);
    }
    const email = emailOrError.getValue();

    // Step 2: Check if user already exists
    const userExists = await this.userRepository.existsByEmail(email);
    if (userExists) {
      return Result.fail(this.getError(command, ErrorCode.USER_ALREADY_EXISTS));
    }

    // Step 3: Hash password
    let hashedPassword: string;
    try {
      hashedPassword = await this.passwordHasher.hash(command.password);
    } catch (error) {
      return Result.fail(this.getError(command, ErrorCode.PASSWORD_HASH_FAILED));
    }

    // Step 4: Create Password value object
    const passwordOrError = Password.create(hashedPassword);
    if (passwordOrError.isFailure) {
      return Result.fail(passwordOrError.getError() as string);
    }
    const password = passwordOrError.getValue();

    // Step 5: Create User aggregate
    const userOrError = User.create(email, password, command.fullName, command.phone);
    if (userOrError.isFailure) {
      return Result.fail(userOrError.getError() as string);
    }
    const user = userOrError.getValue();

    // Step 6: Persist user
    try {
      await this.userRepository.save(user);
    } catch (error) {
      return Result.fail(this.getError(command, ErrorCode.SAVE_USER_FAILED));
    }

    // Step 7: Publish domain events (UserCreated)
    const eventPublisher = getDomainEventPublisher();
    await eventPublisher.publishEventsForAggregate(user);

    return Result.ok(undefined);
  }
}
