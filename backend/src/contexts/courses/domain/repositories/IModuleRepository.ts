import { Module } from '../entities/Module.ts';
import { ModuleId } from '../value-objects/ModuleId.ts';
import { CourseId } from '../value-objects/CourseId.ts';
import { LessonId } from '../value-objects/LessonId.ts';

/**
 * Module Repository Interface
 * Defines the contract for module persistence operations
 */
export interface IModuleRepository {
  /**
   * Save or update a module
   */
  save(module: Module): Promise<void>;

  /**
   * Find a module by its ID
   */
  findById(id: ModuleId): Promise<Module | null>;

  /**
   * Find all modules for a course, ordered by their order field
   */
  findByCourse(courseId: CourseId): Promise<Module[]>;

  /**
   * Check if a module exists for a given course at a specific order
   */
  existsByCourseAndOrder(courseId: CourseId, order: number): Promise<boolean>;

  /**
   * Count modules for a course
   */
  countByCourse(courseId: CourseId): Promise<number>;

  /**
   * Delete a module by ID
   */
  delete(id: ModuleId): Promise<void>;

  /**
   * Delete all modules for a course (cascade from course deletion)
   */
  deleteByCourse(courseId: CourseId): Promise<void>;

  /**
   * Get the next available order number for a course
   */
  getNextOrder(courseId: CourseId): Promise<number>;

  /**
   * Find a module by a lesson ID (for updating/deleting lessons)
   */
  findByLessonId(lessonId: LessonId): Promise<Module | null>;
}
