import type { IEmailValidator } from './IEmailValidator.ts';
import { RFC5322EmailValidator } from './validators/RFC5322EmailValidator.ts';

/**
 * Email Validator Registry
 *
 * Provides global configuration for the default email validator.
 * Uses Singleton pattern to ensure consistent behavior across the application.
 *
 * @example
 * // Configure a custom validator globally
 * EmailValidatorRegistry.setDefault(new SimpleEmailValidator());
 *
 * // All subsequent Email.create() calls will use the new validator
 * const email = Email.create('test@example.com');
 *
 * // Reset to default RFC5322 validator
 * EmailValidatorRegistry.resetToDefault();
 */
export class EmailValidatorRegistry {
  private static instance: EmailValidatorRegistry;
  private validator: IEmailValidator;

  private constructor() {
    this.validator = new RFC5322EmailValidator();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): EmailValidatorRegistry {
    if (!EmailValidatorRegistry.instance) {
      EmailValidatorRegistry.instance = new EmailValidatorRegistry();
    }
    return EmailValidatorRegistry.instance;
  }

  /**
   * Get the current default validator
   */
  public static getDefault(): IEmailValidator {
    return EmailValidatorRegistry.getInstance().validator;
  }

  /**
   * Set a new default validator
   * Affects all subsequent Email.create() calls without explicit validator
   */
  public static setDefault(validator: IEmailValidator): void {
    EmailValidatorRegistry.getInstance().validator = validator;
  }

  /**
   * Reset to the default RFC5322 validator
   */
  public static resetToDefault(): void {
    EmailValidatorRegistry.getInstance().validator = new RFC5322EmailValidator();
  }

  /**
   * Get the name of the current validator
   */
  public static getCurrentValidatorName(): string {
    return EmailValidatorRegistry.getInstance().validator.name;
  }
}
