import { Identifier } from '@shared/domain/Identifier.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { UUID_V7_REGEX } from '@shared/constants/validation.ts';
import { v7 as uuidv7 } from 'uuid';

/**
 * Strongly-typed Section Progress ID value object
 * Prevents accidental confusion with other ID types
 */
export class SectionProgressId extends Identifier<SectionProgressId> {
  private constructor(value: string) {
    super(value);
  }

  /**
   * Create a new SectionProgressId with UUID v7
   */
  public static create(id?: string): SectionProgressId {
    return new SectionProgressId(id ?? uuidv7());
  }

  /**
   * Create a SectionProgressId from an existing string
   * Validates UUID v7 format
   */
  public static createFromString(id: string): Result<SectionProgressId> {
    if (!this.isValidUUIDv7(id)) {
      return Result.fail(ErrorCode.INVALID_SECTION_PROGRESS_ID);
    }
    return Result.ok(new SectionProgressId(id));
  }

  /**
   * Check if a string is a valid UUID v7
   */
  private static isValidUUIDv7(id: string): boolean {
    return UUID_V7_REGEX.test(id);
  }
}
