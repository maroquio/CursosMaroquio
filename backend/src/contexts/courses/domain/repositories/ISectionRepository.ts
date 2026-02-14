import { Section } from '../entities/Section.ts';
import { SectionId } from '../value-objects/SectionId.ts';
import { LessonId } from '../value-objects/LessonId.ts';

/**
 * Section Repository Interface
 * Defines the contract for section persistence operations
 */
export interface ISectionRepository {
  /**
   * Save or update a section
   */
  save(section: Section): Promise<void>;

  /**
   * Find a section by its ID
   */
  findById(id: SectionId): Promise<Section | null>;

  /**
   * Find all sections for a lesson, ordered by their order field
   */
  findByLesson(lessonId: LessonId): Promise<Section[]>;

  /**
   * Check if a section exists for a given lesson at a specific order
   */
  existsByLessonAndOrder(lessonId: LessonId, order: number): Promise<boolean>;

  /**
   * Count sections for a lesson
   */
  countByLesson(lessonId: LessonId): Promise<number>;

  /**
   * Delete a section by ID
   */
  delete(id: SectionId): Promise<void>;

  /**
   * Delete all sections for a lesson (cascade from lesson deletion)
   */
  deleteByLesson(lessonId: LessonId): Promise<void>;

  /**
   * Get the next available order number for a lesson
   */
  getNextOrder(lessonId: LessonId): Promise<number>;
}
