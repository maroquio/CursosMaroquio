import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { CreateLessonBundleCommand } from './CreateLessonBundleCommand.ts';
import { type ILessonBundleRepository } from '../../../domain/repositories/ILessonBundleRepository.ts';
import { type ICourseRepository } from '../../../domain/repositories/ICourseRepository.ts';
import { type IStorageService } from '../../../infrastructure/storage/IStorageService.ts';
import { LessonBundle } from '../../../domain/entities/LessonBundle.ts';
import { LessonId } from '../../../domain/value-objects/LessonId.ts';
import { type LessonBundleDto } from '../../dtos/LessonBundleDto.ts';

/**
 * CreateLessonBundleHandler
 * Handles uploading a new lesson bundle
 */
export class CreateLessonBundleHandler implements ICommandHandler<CreateLessonBundleCommand, LessonBundleDto> {
  constructor(
    private lessonBundleRepository: ILessonBundleRepository,
    private courseRepository: ICourseRepository,
    private storageService: IStorageService
  ) {}

  async execute(command: CreateLessonBundleCommand): Promise<Result<LessonBundleDto>> {
    // 1. Validate lesson ID
    const lessonIdResult = LessonId.createFromString(command.lessonId);
    if (lessonIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_LESSON_ID);
    }
    const lessonId = lessonIdResult.getValue();

    // 2. Verify lesson exists by checking if any course contains this lesson
    const lessonExists = await this.verifyLessonExists(command.lessonId);
    if (!lessonExists) {
      return Result.fail(ErrorCode.LESSON_NOT_FOUND);
    }

    // 3. Get next version number
    const nextVersion = await this.lessonBundleRepository.getNextVersion(lessonId);

    // 4. Upload bundle
    let uploadResult;
    try {
      uploadResult = await this.storageService.uploadBundle(
        lessonId.toValue(),
        nextVersion,
        command.file
      );
    } catch (error) {
      return Result.fail(ErrorCode.BUNDLE_UPLOAD_FAILED);
    }

    // 5. Extract manifest
    const manifest = await this.storageService.extractManifest(uploadResult.storagePath);

    // 6. Determine entrypoint
    const entrypoint = manifest?.entrypoint ?? 'index.html';

    // 7. Verify entrypoint exists
    const entrypointExists = await this.storageService.entrypointExists(uploadResult.storagePath, entrypoint);
    if (!entrypointExists) {
      // Cleanup uploaded bundle
      await this.storageService.deleteBundle(uploadResult.storagePath);
      return Result.fail(ErrorCode.BUNDLE_ENTRYPOINT_NOT_FOUND);
    }

    // 8. Create bundle entity
    const bundleResult = LessonBundle.create(
      lessonId,
      nextVersion,
      uploadResult.storagePath,
      manifest,
      entrypoint
    );

    if (bundleResult.isFailure) {
      // Cleanup uploaded bundle
      await this.storageService.deleteBundle(uploadResult.storagePath);
      return Result.fail(bundleResult.getError() as string);
    }

    const bundle = bundleResult.getValue();

    // 9. Activate if requested
    if (command.activateImmediately) {
      await this.lessonBundleRepository.deactivateAllForLesson(lessonId);
      bundle.activate();
    }

    // 10. Persist
    try {
      await this.lessonBundleRepository.save(bundle);
    } catch (error) {
      // Cleanup uploaded bundle
      await this.storageService.deleteBundle(uploadResult.storagePath);
      return Result.fail(ErrorCode.INTERNAL_ERROR);
    }

    // 11. Publish domain events
    const eventPublisher = getDomainEventPublisher();
    await eventPublisher.publishEventsForAggregate(bundle);

    // 12. Return DTO
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

  /**
   * Verify that a lesson exists
   * Since lessons are embedded in modules within courses, we need to search through all courses
   * TODO: Consider adding a direct lesson lookup method for performance
   */
  private async verifyLessonExists(lessonId: string): Promise<boolean> {
    // Get all courses and check if any contains this lesson
    // This is a simplified approach - in production, you might want a direct query
    const paginatedCourses = await this.courseRepository.findAllPaginated(1, 1000);
    for (const course of paginatedCourses.courses) {
      for (const module of course.getModules()) {
        const lesson = module.getLessons().find(l => l.getId().toValue() === lessonId);
        if (lesson) {
          return true;
        }
      }
    }
    return false;
  }
}
