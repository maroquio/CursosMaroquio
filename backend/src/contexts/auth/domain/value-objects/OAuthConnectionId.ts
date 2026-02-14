import { Identifier } from '@shared/domain/Identifier.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { UUID_V7_REGEX } from '@shared/constants/validation.ts';
import { v7 as uuidv7 } from 'uuid';

/**
 * Strongly-typed OAuth Connection ID value object
 * Prevents accidental confusion with other ID types (e.g., UserId, RoleId)
 */
export class OAuthConnectionId extends Identifier<OAuthConnectionId> {
  private constructor(value: string) {
    super(value);
  }

  /**
   * Create a new OAuthConnectionId with UUID v7
   * UUID v7 is time-ordered, making it efficient for database queries
   */
  public static create(id?: string): OAuthConnectionId {
    return new OAuthConnectionId(id ?? uuidv7());
  }

  /**
   * Create an OAuthConnectionId from an existing string
   * Validates UUID v7 format
   */
  public static createFromString(id: string): Result<OAuthConnectionId> {
    if (!this.isValidUUIDv7(id)) {
      return Result.fail(ErrorCode.INVALID_OAUTH_CONNECTION_ID);
    }
    return Result.ok(new OAuthConnectionId(id));
  }

  /**
   * Check if a string is a valid UUID v7
   */
  private static isValidUUIDv7(id: string): boolean {
    return UUID_V7_REGEX.test(id);
  }
}
