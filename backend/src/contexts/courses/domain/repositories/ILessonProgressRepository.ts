import { LessonProgress } from '../entities/LessonProgress.ts';
import { EnrollmentId } from '../value-objects/EnrollmentId.ts';
import { LessonId } from '../value-objects/LessonId.ts';
import { LessonProgressStatus } from '../value-objects/LessonProgressStatus.ts';

/**
 * Lesson Progress Repository Interface
 * Defines the contract for lesson progress persistence operations
 */
export interface ILessonProgressRepository {
  /**
   * Save or update lesson progress
   */
  save(progress: LessonProgress): Promise<void>;

  /**
   * Find progress for a specific lesson in an enrollment
   */
  findByEnrollmentAndLesson(enrollmentId: EnrollmentId, lessonId: LessonId): Promise<LessonProgress | null>;

  /**
   * Find all progress entries for an enrollment
   */
  findByEnrollment(enrollmentId: EnrollmentId): Promise<LessonProgress[]>;

  /**
   * Count completed lessons for an enrollment
   */
  countCompletedByEnrollment(enrollmentId: EnrollmentId): Promise<number>;

  /**
   * Count lessons with specific status for an enrollment
   */
  countByEnrollmentAndStatus(enrollmentId: EnrollmentId, status: LessonProgressStatus): Promise<number>;

  /**
   * Delete all progress for an enrollment (when enrollment is cancelled)
   */
  deleteByEnrollment(enrollmentId: EnrollmentId): Promise<void>;

  /**
   * Delete progress for a specific lesson across all enrollments (when lesson is deleted)
   */
  deleteByLesson(lessonId: LessonId): Promise<void>;
}
