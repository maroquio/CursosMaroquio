import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * RegisterUserCommand
 * Represents the intent to register a new user
 * Input data from HTTP request is converted to this command
 *
 * @example
 * ```typescript
 * // Without i18n (backward compatible)
 * const command = new RegisterUserCommand(email, password, fullName, phone);
 *
 * // With i18n
 * const command = new RegisterUserCommand(email, password, fullName, phone, ctx.t);
 * ```
 */
export class RegisterUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly fullName: string,
    public readonly phone: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
