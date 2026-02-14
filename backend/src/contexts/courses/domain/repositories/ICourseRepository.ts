import { type IRepository } from '@shared/infrastructure/persistence/IRepository.ts';
import { Course } from '../entities/Course.ts';
import { CourseId } from '../value-objects/CourseId.ts';
import { Slug } from '../value-objects/Slug.ts';
import { CourseStatus } from '../value-objects/CourseStatus.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';

/**
 * Course filter options for listing
 */
export interface CourseFilters {
  status?: CourseStatus;
  instructorId?: UserId;
  search?: string; // Search by title
}

/**
 * Paginated result for courses
 */
export interface PaginatedCourses {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Course Repository Interface
 * Defines the contract for course persistence operations
 */
export interface ICourseRepository extends IRepository<Course, CourseId> {
  /**
   * Find a course by its slug
   */
  findBySlug(slug: Slug): Promise<Course | null>;

  /**
   * Check if a course with the given slug exists
   */
  existsBySlug(slug: Slug): Promise<boolean>;

  /**
   * Find all courses with pagination and optional filters
   */
  findAllPaginated(page: number, limit: number, filters?: CourseFilters): Promise<PaginatedCourses>;

  /**
   * Find published courses with pagination (for public listing)
   */
  findPublishedPaginated(page: number, limit: number, search?: string): Promise<PaginatedCourses>;

  /**
   * Find courses by instructor
   */
  findByInstructor(instructorId: UserId): Promise<Course[]>;

  /**
   * Count total courses matching the filters
   */
  count(filters?: CourseFilters): Promise<number>;
}
