import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { ActivateLessonBundleCommand } from './ActivateLessonBundleCommand.ts';
import { type ILessonBundleRepository } from '../../../domain/repositories/ILessonBundleRepository.ts';
import { LessonBundleId } from '../../../domain/value-objects/LessonBundleId.ts';
import { type LessonBundleDto } from '../../dtos/LessonBundleDto.ts';
import { type IStorageService } from '../../../infrastructure/storage/IStorageService.ts';

/**
 * ActivateLessonBundleHandler
 * Handles activating a specific bundle version
 */
export class ActivateLessonBundleHandler implements ICommandHandler<ActivateLessonBundleCommand, LessonBundleDto> {
  constructor(
    private lessonBundleRepository: ILessonBundleRepository,
    private storageService: IStorageService
  ) {}

  async execute(command: ActivateLessonBundleCommand): Promise<Result<LessonBundleDto>> {
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

    // 3. Check if already active
    if (bundle.getIsActive()) {
      return Result.fail(ErrorCode.BUNDLE_ALREADY_ACTIVE);
    }

    // 4. Deactivate all bundles for this lesson
    await this.lessonBundleRepository.deactivateAllForLesson(bundle.getLessonId());

    // 5. Activate this bundle
    bundle.activate();

    // 6. Persist
    try {
      await this.lessonBundleRepository.save(bundle);
    } catch (error) {
      return Result.fail(ErrorCode.INTERNAL_ERROR);
    }

    // 7. Publish domain events
    const eventPublisher = getDomainEventPublisher();
    await eventPublisher.publishEventsForAggregate(bundle);

    // 8. Return DTO
    const dto: LessonBundleDto = {
      id: bundle.getId().toValue(),
      lessonId: bundle.getLessonId().toValue(),
      version: bundle.getVersion(),
      entrypoint: bundle.getEntrypoint(),
      storagePath: bundle.getStoragePath(),
      bundleUrl: this.storageService.getBundleUrl(bundle.getStoragePath()),
      manifestJson: bundle.getManifestJson(),
      isActive: bundle.getIsActive(),
      createdAt: bundle.getCreatedAt().toISOString(),
    };

    return Result.ok(dto);
  }
}
