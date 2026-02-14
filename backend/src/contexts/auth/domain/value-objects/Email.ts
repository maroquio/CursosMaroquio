import { ValueObject } from '@shared/domain/ValueObject.ts';
import { Result } from '@shared/domain/Result.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import type { IEmailValidator } from '../services/IEmailValidator.ts';
import { EmailValidatorRegistry } from '../services/EmailValidatorRegistry.ts';

/**
 * Email creation options
 */
interface EmailCreateOptions {
  /** Optional custom validator (uses default RFC5322 if not provided) */
  validator?: IEmailValidator;
  /** Optional translation functions for localized error messages */
  t?: TranslationFunctions;
}

/**
 * Email Value Object
 *
 * Ensures email validity and immutability using the Strategy Pattern.
 * Two Email objects with the same address are considered equal.
 *
 * The validation strategy can be customized:
 * - Per-call: Pass a validator to Email.create()
 * - Global: Use EmailValidatorRegistry.setDefault()
 *
 * @example
 * // Use default validator (RFC5322)
 * const email = Email.create('user@example.com');
 *
 * // With i18n support
 * const email = Email.create('user@example.com', { t: ctx.t });
 *
 * // Use custom validator for this call only
 * const email = Email.create('user@example.com', { validator: new SimpleEmailValidator() });
 *
 * // Change global default
 * EmailValidatorRegistry.setDefault(new SimpleEmailValidator());
 */
export class Email extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }

  /**
   * Create a new Email value object
   *
   * @param email - The email address to validate
   * @param options - Optional creation options (validator and/or translator)
   * @returns Result containing Email or error message
   *
   * @example
   * ```typescript
   * // Without i18n (uses English fallback)
   * const result = Email.create('user@example.com');
   *
   * // With i18n
   * const result = Email.create('invalid-email', { t: ctx.t });
   * // Error: "Formato de e-mail inválido" (pt-BR)
   * ```
   */
  public static create(email: string, options?: EmailCreateOptions): Result<Email> {
    const trimmedEmail = email.trim().toLowerCase();
    const effectiveValidator = options?.validator ?? EmailValidatorRegistry.getDefault();

    const validationResult = effectiveValidator.validate(trimmedEmail, options?.t);
    if (validationResult.isFailure) {
      return Result.fail(validationResult.getError()!);
    }

    return Result.ok(new Email(trimmedEmail));
  }

  /**
   * Get the email address as a string
   */
  public getValue(): string {
    return this.props.value;
  }
}
