import { Result } from '@shared/domain/Result.ts';
import {
  ErrorCode,
  getErrorMessage,
  getLocalizedErrorMessage,
} from '@shared/domain/errors/ErrorCodes.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import type { IEmailValidator } from '../IEmailValidator.ts';

/**
 * RFC 5322 Compliant Email Validator
 *
 * Default implementation of IEmailValidator that follows RFC 5322 standards.
 * This is the most comprehensive validation strategy.
 *
 * Validates:
 * - Format according to RFC 5322 regex
 * - Maximum total length (254 chars per RFC 5321)
 * - Local part max 64 chars
 * - Domain max 253 chars
 * - No consecutive dots
 *
 * @example
 * ```typescript
 * // Without i18n (uses English fallback)
 * const result = validator.validate('invalid');
 *
 * // With i18n
 * const result = validator.validate('invalid', ctx.t);
 * // Error: "Formato de e-mail inválido" (pt-BR)
 * ```
 */
export class RFC5322EmailValidator implements IEmailValidator {
  public readonly name = 'RFC5322EmailValidator';

  /**
   * Maximum email length per RFC 5321
   */
  private static readonly MAX_LENGTH = 254;

  /**
   * RFC 5322 compliant email regex
   * Validates:
   * - Local part (before @): allows letters, numbers, and special chars
   * - Domain: must have at least one dot, valid TLD (min 2 chars)
   */
  private static readonly EMAIL_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

  /**
   * Get error message with i18n support
   */
  private getMessage(code: ErrorCode, t?: TranslationFunctions): string {
    return t ? getLocalizedErrorMessage(code, t) : getErrorMessage(code);
  }

  public validate(email: string, t?: TranslationFunctions): Result<void> {
    if (!email || email.length === 0) {
      return Result.fail(this.getMessage(ErrorCode.INVALID_EMAIL_FORMAT, t));
    }

    if (email.length > RFC5322EmailValidator.MAX_LENGTH) {
      return Result.fail(this.getMessage(ErrorCode.EMAIL_TOO_LONG, t));
    }

    if (!this.isValidFormat(email)) {
      return Result.fail(`${this.getMessage(ErrorCode.INVALID_EMAIL_FORMAT, t)}: ${email}`);
    }

    return Result.ok<void>(undefined);
  }

  private isValidFormat(email: string): boolean {
    // Check basic format with comprehensive regex
    if (!RFC5322EmailValidator.EMAIL_REGEX.test(email)) {
      return false;
    }

    // Additional validations
    const [localPart, domain] = email.split('@');

    // Local part max 64 chars per RFC 5321
    if (!localPart || localPart.length > 64) {
      return false;
    }

    // Domain max 253 chars
    if (!domain || domain.length > 253) {
      return false;
    }

    // No consecutive dots
    if (email.includes('..')) {
      return false;
    }

    return true;
  }
}
