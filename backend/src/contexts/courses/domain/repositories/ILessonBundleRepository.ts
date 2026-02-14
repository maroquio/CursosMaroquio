import { type IRepository } from '@shared/infrastructure/persistence/IRepository.ts';
import { LessonBundle } from '../entities/LessonBundle.ts';
import { LessonBundleId } from '../value-objects/LessonBundleId.ts';
import { LessonId } from '../value-objects/LessonId.ts';

/**
 * LessonBundle Repository Interface
 * Defines the contract for lesson bundle persistence operations
 */
export interface ILessonBundleRepository extends IRepository<LessonBundle, LessonBundleId> {
  /**
   * Find all bundles for a specific lesson
   * Returns bundles sorted by version descending (newest first)
   */
  findByLessonId(lessonId: LessonId): Promise<LessonBundle[]>;

  /**
   * Find the active bundle for a specific lesson
   * Returns null if no bundle is active
   */
  findActiveByLessonId(lessonId: LessonId): Promise<LessonBundle | null>;

  /**
   * Get the next version number for a lesson's bundles
   * Returns 1 if no bundles exist, otherwise max(version) + 1
   */
  getNextVersion(lessonId: LessonId): Promise<number>;

  /**
   * Deactivate all bundles for a specific lesson
   * Used before activating a new bundle to ensure only one is active
   */
  deactivateAllForLesson(lessonId: LessonId): Promise<void>;
}
