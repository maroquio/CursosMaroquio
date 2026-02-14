import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import type { IEmailValidator } from '../IEmailValidator.ts';

/**
 * Simple Email Validator
 *
 * A less strict email validation strategy.
 * Use this when you need basic format validation without full RFC compliance.
 *
 * Validates:
 * - Contains exactly one @ symbol
 * - Has content before and after @
 * - Domain has at least one dot
 * - No spaces or special characters
 */
export class SimpleEmailValidator implements IEmailValidator {
  public readonly name = 'SimpleEmailValidator';

  /**
   * Simple email regex
   * Less strict than RFC 5322, but covers most practical cases
   */
  private static readonly SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  public validate(email: string): Result<void> {
    if (!email || email.length === 0) {
      return Result.fail(ErrorCode.INVALID_EMAIL_FORMAT);
    }

    if (!SimpleEmailValidator.SIMPLE_EMAIL_REGEX.test(email)) {
      return Result.fail(ErrorCode.INVALID_EMAIL_FORMAT);
    }

    return Result.ok<void>(undefined);
  }
}
