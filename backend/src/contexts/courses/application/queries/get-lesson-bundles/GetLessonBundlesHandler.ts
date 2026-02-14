import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { GetLessonBundlesQuery } from './GetLessonBundlesQuery.ts';
import { type ILessonBundleRepository } from '../../../domain/repositories/ILessonBundleRepository.ts';
import { type IStorageService } from '../../../infrastructure/storage/IStorageService.ts';
import { LessonId } from '../../../domain/value-objects/LessonId.ts';
import { type LessonBundlesListDto, type LessonBundleDto } from '../../dtos/LessonBundleDto.ts';

/**
 * GetLessonBundlesHandler
 * Handles listing all bundles for a lesson
 */
export class GetLessonBundlesHandler implements IQueryHandler<GetLessonBundlesQuery, LessonBundlesListDto> {
  constructor(
    private lessonBundleRepository: ILessonBundleRepository,
    private storageService: IStorageService
  ) {}

  async execute(query: GetLessonBundlesQuery): Promise<Result<LessonBundlesListDto>> {
    // 1. Validate lesson ID
    const lessonIdResult = LessonId.createFromString(query.lessonId);
    if (lessonIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_LESSON_ID);
    }
    const lessonId = lessonIdResult.getValue();

    // 2. Get all bundles for lesson
    const bundles = await this.lessonBundleRepository.findByLessonId(lessonId);

    // 3. Map to DTOs
    const bundleDtos: LessonBundleDto[] = bundles.map(bundle => ({
      id: bundle.getId().toValue(),
      lessonId: bundle.getLessonId().toValue(),
      version: bundle.getVersion(),
      entrypoint: bundle.getEntrypoint(),
      storagePath: bundle.getStoragePath(),
      bundleUrl: this.storageService.getBundleUrl(bundle.getStoragePath()),
      manifestJson: bundle.getManifestJson(),
      isActive: bundle.getIsActive(),
      createdAt: bundle.getCreatedAt().toISOString(),
    }));

    // 4. Find active version
    const activeBundle = bundles.find(b => b.getIsActive());
    const activeVersion = activeBundle ? activeBundle.getVersion() : null;

    // 5. Return list DTO
    const dto: LessonBundlesListDto = {
      lessonId: lessonId.toValue(),
      bundles: bundleDtos,
      activeVersion,
    };

    return Result.ok(dto);
  }
}
