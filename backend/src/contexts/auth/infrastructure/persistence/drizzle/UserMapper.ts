import { User } from '../../../domain/entities/User.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';
import { Email } from '../../../domain/value-objects/Email.ts';
import { Password } from '../../../domain/value-objects/Password.ts';
import { Role } from '../../../domain/value-objects/Role.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { type UserSchema } from './schema.ts';

/**
 * UserMapper
 * Converts between User aggregate and database schema
 * Acts as an adapter between domain and infrastructure layers
 */
export class UserMapper {
  /**
   * Convert User aggregate to database row
   */
  public static toPersistence(user: User) {
    return {
      id: user.getId().toValue(),
      email: user.getEmail().getValue(),
      password: user.getPassword().getHash(),
      fullName: user.getFullName(),
      phone: user.getPhone(),
      isActive: user.isActive(),
      photoUrl: user.getPhotoUrl(),
      createdAt: user.getCreatedAt(),
    };
  }

  /**
   * Convert database row to User aggregate
   * Returns Result<User> for functional error handling
   * @param raw - Database row
   * @param roles - Optional array of roles (loaded separately from user_roles table)
   */
  public static toDomain(raw: UserSchema, roles: Role[] = []): Result<User> {
    const userIdOrError = UserId.createFromString(raw.id);
    if (userIdOrError.isFailure) {
      return Result.fail(ErrorCode.MAPPER_INVALID_USER_ID);
    }

    const emailOrError = Email.create(raw.email);
    if (emailOrError.isFailure) {
      return Result.fail(ErrorCode.MAPPER_INVALID_EMAIL);
    }

    const passwordOrError = Password.create(raw.password);
    if (passwordOrError.isFailure) {
      return Result.fail(ErrorCode.MAPPER_INVALID_PASSWORD_HASH);
    }

    return Result.ok(
      User.reconstruct(
        userIdOrError.getValue(),
        emailOrError.getValue(),
        passwordOrError.getValue(),
        raw.fullName,
        raw.phone,
        raw.isActive,
        raw.createdAt,
        roles,
        [],
        raw.photoUrl ?? null
      )
    );
  }
}
