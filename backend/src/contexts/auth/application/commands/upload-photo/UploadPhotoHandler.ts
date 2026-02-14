import { mkdir, rm, access } from 'node:fs/promises';
import { join } from 'node:path';
import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import {
  ErrorCode,
  getErrorMessage,
  getLocalizedErrorMessage,
} from '@shared/domain/errors/ErrorCodes.ts';
import type { TranslationFunctions } from '@shared/infrastructure/i18n/i18n-types.js';
import { UploadPhotoCommand } from './UploadPhotoCommand.ts';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.ts';
import { UserId } from '../../../domain/value-objects/UserId.ts';

// Allowed MIME types for profile photos
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * UploadPhotoHandler
 * Handles user profile photo upload with the following steps:
 * 1. Validate user ID
 * 2. Find user
 * 3. Validate file type and size
 * 4. Save file to storage
 * 5. Update user photoUrl
 * 6. Delete old photo if exists
 */
export class UploadPhotoHandler implements ICommandHandler<UploadPhotoCommand, string> {
  private storagePath: string;

  constructor(
    private userRepository: IUserRepository,
    storagePath: string = './uploads/avatars'
  ) {
    this.storagePath = storagePath;
  }

  /**
   * Get error message with i18n support
   */
  private getError(
    t: TranslationFunctions | undefined,
    code: ErrorCode
  ): string {
    return t ? getLocalizedErrorMessage(code, t) : getErrorMessage(code);
  }

  /**
   * Get file extension from MIME type
   */
  private getExtension(mimeType: string): string {
    switch (mimeType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      default:
        return 'jpg';
    }
  }

  async execute(command: UploadPhotoCommand): Promise<Result<string>> {
    const { t, file } = command;

    // 1. Validate user ID
    const userIdResult = UserId.createFromString(command.userId);
    if (userIdResult.isFailure) {
      return Result.fail(this.getError(t, ErrorCode.INVALID_USER_ID));
    }
    const userId = userIdResult.getValue();

    // 2. Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return Result.fail(this.getError(t, ErrorCode.USER_NOT_FOUND));
    }

    // 3. Check if user is active
    if (!user.isActive()) {
      return Result.fail(this.getError(t, ErrorCode.USER_NOT_FOUND));
    }

    // 4. Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return Result.fail(this.getError(t, ErrorCode.PHOTO_INVALID_TYPE));
    }

    // 5. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return Result.fail(this.getError(t, ErrorCode.PHOTO_TOO_LARGE));
    }

    // 6. Create storage directory if it doesn't exist
    try {
      await mkdir(this.storagePath, { recursive: true });
    } catch {
      return Result.fail(this.getError(t, ErrorCode.PHOTO_UPLOAD_FAILED));
    }

    // 7. Generate unique filename
    const extension = this.getExtension(file.type);
    const filename = `${userId.toValue()}_${Date.now()}.${extension}`;
    const filepath = join(this.storagePath, filename);

    // 8. Save file
    try {
      const arrayBuffer = await file.arrayBuffer();
      await Bun.write(filepath, arrayBuffer);
    } catch {
      return Result.fail(this.getError(t, ErrorCode.PHOTO_UPLOAD_FAILED));
    }

    // 9. Delete old photo if exists
    const oldPhotoUrl = user.getPhotoUrl();
    if (oldPhotoUrl) {
      const oldFilename = oldPhotoUrl.split('/').pop();
      if (oldFilename) {
        const oldFilepath = join(this.storagePath, oldFilename);
        try {
          await access(oldFilepath);
          await rm(oldFilepath);
        } catch {
          // Ignore if old file doesn't exist
        }
      }
    }

    // 10. Generate photo URL
    const photoUrl = `/uploads/avatars/${filename}`;

    // 11. Update user photoUrl
    user.updatePhotoUrl(photoUrl);

    // 12. Persist updated user
    try {
      await this.userRepository.save(user);
    } catch {
      // Try to delete the uploaded file on failure
      try {
        await rm(filepath);
      } catch {
        // Ignore
      }
      return Result.fail(this.getError(t, ErrorCode.SAVE_USER_FAILED));
    }

    return Result.ok(photoUrl);
  }
}
