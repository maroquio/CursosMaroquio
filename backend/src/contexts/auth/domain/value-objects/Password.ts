import { ValueObject } from '@shared/domain/ValueObject.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

/**
 * Password Value Object
 * Represents a hashed password, never the plain text
 * Password hashing should be done in application/infrastructure layer
 */
export class Password extends ValueObject<{ hashedPassword: string }> {
  private constructor(hashedPassword: string) {
    super({ hashedPassword });
  }

  /**
   * Create a new Password value object from a hashed password
   * The password should be hashed before creating this object
   */
  public static create(hashedPassword: string): Result<Password> {
    if (!hashedPassword || hashedPassword.trim().length === 0) {
      return Result.fail(ErrorCode.PASSWORD_HASH_EMPTY);
    }

    if (hashedPassword.length < 20) {
      return Result.fail(ErrorCode.INVALID_PASSWORD_HASH);
    }

    return Result.ok(new Password(hashedPassword));
  }

  /**
   * Get the hashed password
   */
  public getHash(): string {
    return this.props.hashedPassword;
  }
}
