import { Identifier } from '@shared/domain/Identifier.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { UUID_V7_REGEX } from '@shared/constants/validation.ts';
import { v7 as uuidv7 } from 'uuid';

/**
 * Strongly-typed Category ID value object
 * Prevents accidental confusion with other ID types
 */
export class CategoryId extends Identifier<CategoryId> {
  private constructor(value: string) {
    super(value);
  }

  /**
   * Create a new CategoryId with UUID v7
   * UUID v7 is time-ordered, making it efficient for database queries
   */
  public static create(id?: string): CategoryId {
    return new CategoryId(id ?? uuidv7());
  }

  /**
   * Create a CategoryId from an existing string
   * Validates UUID v7 format
   */
  public static createFromString(id: string): Result<CategoryId> {
    if (!this.isValidUUIDv7(id)) {
      return Result.fail(ErrorCode.INVALID_CATEGORY_ID);
    }
    return Result.ok(new CategoryId(id));
  }

  /**
   * Check if a string is a valid UUID v7
   */
  private static isValidUUIDv7(id: string): boolean {
    return UUID_V7_REGEX.test(id);
  }
}
