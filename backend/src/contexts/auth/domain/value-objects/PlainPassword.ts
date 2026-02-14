import { ValueObject } from '@shared/domain/ValueObject.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

/**
 * Password validation configuration
 */
interface PasswordConfig {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

/**
 * Default password requirements
 */
const DEFAULT_CONFIG: PasswordConfig = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
};

/**
 * PlainPassword Value Object
 * Represents an unhasned password with validation rules
 * Used for password input validation before hashing
 *
 * This is separate from Password (which holds hashed passwords)
 * to enforce the rule that plain passwords should never be stored
 */
export class PlainPassword extends ValueObject<{ value: string }> {
  private static config: PasswordConfig = DEFAULT_CONFIG;

  private constructor(value: string) {
    super({ value });
  }

  /**
   * Configure password requirements
   */
  public static configure(config: Partial<PasswordConfig>): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Reset to default configuration
   */
  public static resetConfig(): void {
    this.config = DEFAULT_CONFIG;
  }

  /**
   * Create a new PlainPassword value object
   * Validates password against security requirements
   *
   * @param password - The plain text password to validate
   * @returns Result with PlainPassword or ErrorCode
   *
   * @example
   * ```typescript
   * const result = PlainPassword.create('weak');
   * if (result.isFailure) {
   *   console.log(result.getError()); // ErrorCode.PASSWORD_TOO_SHORT
   * }
   * ```
   */
  public static create(password: string): Result<PlainPassword> {
    const errorCode = this.validate(password);

    if (errorCode) {
      return Result.fail(errorCode);
    }

    return Result.ok(new PlainPassword(password));
  }

  /**
   * Validate password against all rules
   * Returns first ErrorCode encountered, or undefined if valid
   */
  private static validate(password: string): ErrorCode | undefined {
    if (!password) {
      return ErrorCode.PASSWORD_REQUIRED;
    }

    // Length validation
    if (password.length < this.config.minLength) {
      return ErrorCode.PASSWORD_TOO_SHORT;
    }

    if (password.length > this.config.maxLength) {
      return ErrorCode.PASSWORD_TOO_LONG;
    }

    // Complexity validation
    if (this.config.requireUppercase && !/[A-Z]/.test(password)) {
      return ErrorCode.PASSWORD_NEEDS_UPPERCASE;
    }

    if (this.config.requireLowercase && !/[a-z]/.test(password)) {
      return ErrorCode.PASSWORD_NEEDS_LOWERCASE;
    }

    if (this.config.requireNumbers && !/[0-9]/.test(password)) {
      return ErrorCode.PASSWORD_NEEDS_NUMBER;
    }

    if (this.config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return ErrorCode.PASSWORD_NEEDS_SPECIAL;
    }

    // Common password check (basic)
    const commonPasswords = ['password', '123456', 'qwerty', 'password123'];
    if (commonPasswords.includes(password.toLowerCase())) {
      return ErrorCode.PASSWORD_TOO_COMMON;
    }

    return undefined;
  }

  /**
   * Get the plain password value
   * Use with caution - should only be used for hashing
   */
  public getValue(): string {
    return this.props.value;
  }

  /**
   * Get current password requirements (for UI hints)
   */
  public static getRequirements(): PasswordConfig {
    return { ...this.config };
  }
}
