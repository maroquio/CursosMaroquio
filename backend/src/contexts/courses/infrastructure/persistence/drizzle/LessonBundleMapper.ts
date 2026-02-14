import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { LessonBundle, type BundleManifest } from '../../../domain/entities/LessonBundle.ts';
import { LessonBundleId } from '../../../domain/value-objects/LessonBundleId.ts';
import { LessonId } from '../../../domain/value-objects/LessonId.ts';
import { type LessonBundleSchema } from './schema.ts';

/**
 * LessonBundleMapper
 * Converts between LessonBundle entity and database schema
 */
export class LessonBundleMapper {
  /**
   * Convert LessonBundle entity to database row
   */
  public static toPersistence(bundle: LessonBundle) {
    return {
      id: bundle.getId().toValue(),
      lessonId: bundle.getLessonId().toValue(),
      version: bundle.getVersion(),
      entrypoint: bundle.getEntrypoint(),
      storagePath: bundle.getStoragePath(),
      manifestJson: bundle.getManifestJson(),
      isActive: bundle.getIsActive(),
      createdAt: bundle.getCreatedAt(),
    };
  }

  /**
   * Convert database row to LessonBundle entity
   */
  public static toDomain(raw: LessonBundleSchema): Result<LessonBundle> {
    const bundleIdResult = LessonBundleId.createFromString(raw.id);
    if (bundleIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_LESSON_BUNDLE_ID);
    }

    const lessonIdResult = LessonId.createFromString(raw.lessonId);
    if (lessonIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_LESSON_ID);
    }

    const bundle = LessonBundle.reconstruct(
      bundleIdResult.getValue(),
      lessonIdResult.getValue(),
      raw.version,
      raw.entrypoint,
      raw.storagePath,
      raw.manifestJson as BundleManifest | null,
      raw.isActive,
      raw.createdAt
    );

    return Result.ok(bundle);
  }
}
