import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { DeleteLessonBundleCommand } from './DeleteLessonBundleCommand.ts';
import { type ILessonBundleRepository } from '../../../domain/repositories/ILessonBundleRepository.ts';
import { type IStorageService } from '../../../infrastructure/storage/IStorageService.ts';
import { LessonBundleId } from '../../../domain/value-objects/LessonBundleId.ts';
import { createLogger } from '@shared/infrastructure/logging/Logger.ts';

const logger = createLogger('DeleteLessonBundle');

/**
 * DeleteLessonBundleHandler
 * Handles deleting a bundle version
 */
export class DeleteLessonBundleHandler implements ICommandHandler<DeleteLessonBundleCommand, void> {
  constructor(
    private lessonBundleRepository: ILessonBundleRepository,
    private storageService: IStorageService
  ) {}

  async execute(command: DeleteLessonBundleCommand): Promise<Result<void>> {
    // 1. Validate bundle ID
    const bundleIdResult = LessonBundleId.createFromString(command.bundleId);
    if (bundleIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_LESSON_BUNDLE_ID);
    }
    const bundleId = bundleIdResult.getValue();

    // 2. Find bundle
    const bundle = await this.lessonBundleRepository.findById(bundleId);
    if (!bundle) {
      return Result.fail(ErrorCode.BUNDLE_NOT_FOUND);
    }

    // 3. Check if can delete (cannot delete active bundle)
    const canDeleteResult = bundle.canDelete();
    if (canDeleteResult.isFailure) {
      return Result.fail(canDeleteResult.getError() as string);
    }

    // 4. Delete from storage
    try {
      await this.storageService.deleteBundle(bundle.getStoragePath());
    } catch (error) {
      // Log but continue - storage cleanup is not critical
      logger.error('Failed to delete bundle from storage', error instanceof Error ? error : new Error(String(error)));
    }

    // 5. Delete from repository
    try {
      await this.lessonBundleRepository.delete(bundleId);
    } catch (error) {
      return Result.fail(ErrorCode.INTERNAL_ERROR);
    }

    return Result.ok(undefined);
  }
}
