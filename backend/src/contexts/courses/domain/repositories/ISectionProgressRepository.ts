import { SectionProgress } from '../entities/SectionProgress.ts';
import { SectionProgressId } from '../value-objects/SectionProgressId.ts';
import { EnrollmentId } from '../value-objects/EnrollmentId.ts';
import { SectionId } from '../value-objects/SectionId.ts';
import { LessonId } from '../value-objects/LessonId.ts';
import { LessonProgressStatus } from '../value-objects/LessonProgressStatus.ts';

/**
 * Section Progress Repository Interface
 * Defines the contract for section progress persistence operations
 */
export interface ISectionProgressRepository {
  /**
   * Save or update section progress
   */
  save(progress: SectionProgress): Promise<void>;

  /**
   * Find progress by ID
   */
  findById(id: SectionProgressId): Promise<SectionProgress | null>;

  /**
   * Find progress for a specific section in an enrollment
   */
  findByEnrollmentAndSection(enrollmentId: EnrollmentId, sectionId: SectionId): Promise<SectionProgress | null>;

  /**
   * Find all section progress entries for an enrollment
   */
  findByEnrollment(enrollmentId: EnrollmentId): Promise<SectionProgress[]>;

  /**
   * Find all section progress entries for a specific lesson within an enrollment
   * (joins through sections to get all sections of a lesson)
   */
  findByEnrollmentAndLesson(enrollmentId: EnrollmentId, lessonId: LessonId): Promise<SectionProgress[]>;

  /**
   * Count completed sections for a lesson within an enrollment
   */
  countCompletedByEnrollmentAndLesson(enrollmentId: EnrollmentId, lessonId: LessonId): Promise<number>;

  /**
   * Count sections with specific status for an enrollment
   */
  countByEnrollmentAndStatus(enrollmentId: EnrollmentId, status: LessonProgressStatus): Promise<number>;

  /**
   * Check if all sections of a lesson are completed for an enrollment
   */
  areAllSectionsCompleted(enrollmentId: EnrollmentId, lessonId: LessonId, totalSections: number): Promise<boolean>;

  /**
   * Delete all progress for an enrollment (when enrollment is cancelled)
   */
  deleteByEnrollment(enrollmentId: EnrollmentId): Promise<void>;

  /**
   * Delete progress for a specific section across all enrollments (when section is deleted)
   */
  deleteBySection(sectionId: SectionId): Promise<void>;

  /**
   * Create or get progress for a section (ensures a progress record exists)
   */
  getOrCreate(enrollmentId: EnrollmentId, sectionId: SectionId): Promise<SectionProgress>;
}
