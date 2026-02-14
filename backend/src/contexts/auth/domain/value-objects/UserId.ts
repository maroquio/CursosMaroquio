import { Identifier } from '@shared/domain/Identifier.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { v7 as uuidv7 } from 'uuid';
import { UUID_V7_REGEX } from '@shared/constants/validation.ts';

/**
 * Strongly-typed User ID value object
 * Prevents accidental confusion with other ID types (e.g., TaskId)
 */
export class UserId extends Identifier<UserId> {
  private constructor(value: string) {
    super(value);
  }

  /**
   * Create a new UserId with UUID v7
   * UUID v7 is time-ordered, making it efficient for database queries
   */
  public static create(id?: string): UserId {
    return new UserId(id ?? uuidv7());
  }

  /**
   * Create a UserId from an existing string
   * Validates UUID v7 format
   */
  public static createFromString(id: string): Result<UserId> {
    if (!this.isValidUUIDv7(id)) {
      return Result.fail(ErrorCode.INVALID_USER_ID);
    }
    return Result.ok(new UserId(id));
  }

  /**
   * Check if a string is a valid UUID v7
   */
  private static isValidUUIDv7(id: string): boolean {
    return UUID_V7_REGEX.test(id);
  }
}
