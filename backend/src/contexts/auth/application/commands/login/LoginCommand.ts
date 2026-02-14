import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * Login Command
 * Request to authenticate a user with email and password
 *
 * @example
 * ```typescript
 * // Without i18n
 * const command = new LoginCommand(email, password);
 *
 * // With i18n
 * const command = new LoginCommand(email, password, userAgent, ipAddress, ctx.t);
 * ```
 */
export class LoginCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly userAgent?: string,
    public readonly ipAddress?: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
