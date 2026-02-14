import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';

/**
 * UploadPhotoCommand
 * Command for a user to upload their profile photo
 */
export class UploadPhotoCommand {
  constructor(
    public readonly userId: string,
    public readonly file: File,
    /** Optional translator for localized error messages */
    public readonly t?: TranslationFunctions
  ) {}
}
