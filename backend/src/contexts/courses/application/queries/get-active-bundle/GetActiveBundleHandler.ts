import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { GetActiveBundleQuery } from './GetActiveBundleQuery.ts';
import { type ILessonBundleRepository } from '../../../domain/repositories/ILessonBundleRepository.ts';
import { type IStorageService } from '../../../infrastructure/storage/IStorageService.ts';
import { LessonId } from '../../../domain/value-objects/LessonId.ts';
import { type LessonBundleDto } from '../../dtos/LessonBundleDto.ts';

/**
 * GetActiveBundleHandler
 * Handles getting the active bundle for a lesson
 */
export class GetActiveBundleHandler implements IQueryHandler<GetActiveBundleQuery, LessonBundleDto | null> {
  constructor(
    private lessonBundleRepository: ILessonBundleRepository,
    private storageService: IStorageService
  ) {}

  async execute(query: GetActiveBundleQuery): Promise<Result<LessonBundleDto | null>> {
    // 1. Validate lesson ID
    const lessonIdResult = LessonId.createFromString(query.lessonId);
    if (lessonIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_LESSON_ID);
    }
    const lessonId = lessonIdResult.getValue();

    // 2. Get active bundle for lesson
    const bundle = await this.lessonBundleRepository.findActiveByLessonId(lessonId);

    // 3. Return null if no active bundle
    if (!bundle) {
      return Result.ok(null);
    }

    // 4. Map to DTO
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
