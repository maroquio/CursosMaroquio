import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * Refresh Token Command
 * Request to refresh an access token using a refresh token
 */
export class RefreshTokenCommand {
  constructor(
    public readonly refreshToken: string,
    public readonly userAgent?: string,
    public readonly ipAddress?: string,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
