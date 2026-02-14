import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { LessonProgress } from '../../../domain/entities/LessonProgress.ts';
import { EnrollmentId } from '../../../domain/value-objects/EnrollmentId.ts';
import { LessonId } from '../../../domain/value-objects/LessonId.ts';
import { LessonProgressStatus, parseLessonProgressStatus } from '../../../domain/value-objects/LessonProgressStatus.ts';
import { type LessonProgressSchema } from './schema.ts';

/**
 * LessonProgressMapper
 * Converts between LessonProgress entity and database schema
 */
export class LessonProgressMapper {
  /**
   * Convert LessonProgress entity to database row
   */
  public static toPersistence(progress: LessonProgress) {
    return {
      id: progress.getProgressId(),
      enrollmentId: progress.getEnrollmentId().toValue(),
      lessonId: progress.getLessonId().toValue(),
      status: progress.getStatus(),
      watchedSeconds: progress.getWatchedSeconds(),
      completedAt: progress.getCompletedAt(),
      lastWatchedAt: progress.getLastWatchedAt(),
    };
  }

  /**
   * Convert database row to LessonProgress entity
   */
  public static toDomain(raw: LessonProgressSchema): Result<LessonProgress> {
    const enrollmentIdResult = EnrollmentId.createFromString(raw.enrollmentId);
    if (enrollmentIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_ENROLLMENT_ID);
    }

    const lessonIdResult = LessonId.createFromString(raw.lessonId);
    if (lessonIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_LESSON_ID);
    }

    const status = parseLessonProgressStatus(raw.status);
    if (!status) {
      return Result.fail(ErrorCode.VALIDATION_ERROR);
    }

    const progress = LessonProgress.reconstruct(
      raw.id,
      enrollmentIdResult.getValue(),
      lessonIdResult.getValue(),
      status,
      raw.watchedSeconds,
      raw.completedAt,
      raw.lastWatchedAt
    );

    return Result.ok(progress);
  }
}
