import { Result } from '@shared/domain/Result.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * Email Validator Strategy Interface
 *
 * Implements the Strategy Pattern for email validation.
 * Allows different validation strategies to be used interchangeably.
 *
 * @example
 * // Create a custom validator
 * class CorporateEmailValidator implements IEmailValidator {
 *   validate(email: string, t?: TranslationFunctions): Result<void> {
 *     if (!email.endsWith('@company.com')) {
 *       return Result.fail(t ? t.auth.email.invalidFormat() : 'Only corporate emails allowed');
 *     }
 *     return Result.ok();
 *   }
 * }
 */
export interface IEmailValidator {
  /**
   * Validate an email address
   * @param email - The email address to validate (already trimmed and lowercased)
   * @param t - Optional translation functions for localized error messages
   * @returns Result.ok() if valid, Result.fail(message) if invalid
   */
  validate(email: string, t?: TranslationFunctions): Result<void>;

  /**
   * Get the validator name for logging/debugging purposes
   */
  readonly name: string;
}
