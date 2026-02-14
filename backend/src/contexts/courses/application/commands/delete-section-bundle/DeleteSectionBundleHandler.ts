import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { DeleteSectionBundleCommand } from './DeleteSectionBundleCommand.ts';
import { type ISectionBundleRepository } from '../../../domain/repositories/ISectionBundleRepository.ts';
import { type IStorageService } from '../../../infrastructure/storage/IStorageService.ts';
import { SectionBundleId } from '../../../domain/value-objects/SectionBundleId.ts';
import { createLogger } from '@shared/infrastructure/logging/Logger.ts';

const logger = createLogger('DeleteSectionBundle');

/**
 * DeleteSectionBundleHandler
 * Handles deleting a section bundle version
 */
export class DeleteSectionBundleHandler implements ICommandHandler<DeleteSectionBundleCommand, void> {
  constructor(
    private sectionBundleRepository: ISectionBundleRepository,
    private storageService: IStorageService
  ) {}

  async execute(command: DeleteSectionBundleCommand): Promise<Result<void>> {
    // 1. Validate bundle ID
    const bundleIdResult = SectionBundleId.createFromString(command.bundleId);
    if (bundleIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_SECTION_BUNDLE_ID);
    }
    const bundleId = bundleIdResult.getValue();

    // 2. Find bundle
    const bundle = await this.sectionBundleRepository.findById(bundleId);
    if (!bundle) {
      return Result.fail(ErrorCode.SECTION_BUNDLE_NOT_FOUND);
    }

    // 3. Check if can delete (cannot delete active bundle)
    const canDeleteResult = bundle.canDelete();
    if (canDeleteResult.isFailure) {
      return Result.fail(canDeleteResult.getError() as string);
    }

    // 4. Delete from storage
    try {
      await this.storageService.deleteSectionBundle(bundle.getStoragePath());
    } catch (error) {
      // Log but continue - storage cleanup is not critical
      logger.error('Failed to delete section bundle from storage', error instanceof Error ? error : new Error(String(error)));
    }

    // 5. Delete from repository
    try {
      await this.sectionBundleRepository.delete(bundleId);
    } catch (error) {
      return Result.fail(ErrorCode.INTERNAL_ERROR);
    }

    return Result.ok(undefined);
  }
}
