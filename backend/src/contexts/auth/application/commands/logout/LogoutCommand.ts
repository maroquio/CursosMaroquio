import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * Logout Command
 * Request to invalidate a user session (revoke refresh token)
 */
export class LogoutCommand {
  constructor(
    public readonly refreshToken: string,
    /** If true, logout from all devices (revoke all tokens) */
    public readonly logoutAll: boolean = false,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
