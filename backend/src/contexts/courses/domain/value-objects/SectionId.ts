import { Identifier } from '@shared/domain/Identifier.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { UUID_V7_REGEX } from '@shared/constants/validation.ts';
import { v7 as uuidv7 } from 'uuid';

/**
 * Strongly-typed Section ID value object
 * Prevents accidental confusion with other ID types
 */
export class SectionId extends Identifier<SectionId> {
  private constructor(value: string) {
    super(value);
  }

  /**
   * Create a new SectionId with UUID v7
   */
  public static create(id?: string): SectionId {
    return new SectionId(id ?? uuidv7());
  }

  /**
   * Create a SectionId from an existing string
   * Validates UUID v7 format
   */
  public static createFromString(id: string): Result<SectionId> {
    if (!this.isValidUUIDv7(id)) {
      return Result.fail(ErrorCode.INVALID_SECTION_ID);
    }
    return Result.ok(new SectionId(id));
  }

  /**
   * Check if a string is a valid UUID v7
   */
  private static isValidUUIDv7(id: string): boolean {
    return UUID_V7_REGEX.test(id);
  }
}
