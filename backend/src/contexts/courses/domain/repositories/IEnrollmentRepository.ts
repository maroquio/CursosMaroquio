import { type IRepository } from '@shared/infrastructure/persistence/IRepository.ts';
import { Enrollment } from '../entities/Enrollment.ts';
import { EnrollmentId } from '../value-objects/EnrollmentId.ts';
import { CourseId } from '../value-objects/CourseId.ts';
import { EnrollmentStatus } from '../value-objects/EnrollmentStatus.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';

/**
 * Enrollment filter options for listing
 */
export interface EnrollmentFilters {
  status?: EnrollmentStatus;
  courseId?: CourseId;
  studentId?: UserId;
}

/**
 * Paginated result for enrollments
 */
export interface PaginatedEnrollments {
  enrollments: Enrollment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Enrollment Repository Interface
 * Defines the contract for enrollment persistence operations
 */
export interface IEnrollmentRepository extends IRepository<Enrollment, EnrollmentId> {
  /**
   * Find enrollment by student and course
   */
  findByStudentAndCourse(studentId: UserId, courseId: CourseId): Promise<Enrollment | null>;

  /**
   * Check if student is enrolled in course
   */
  existsByStudentAndCourse(studentId: UserId, courseId: CourseId): Promise<boolean>;

  /**
   * Find all enrollments for a student
   */
  findByStudent(studentId: UserId, status?: EnrollmentStatus): Promise<Enrollment[]>;

  /**
   * Find all enrollments for a course
   */
  findByCourse(courseId: CourseId, status?: EnrollmentStatus): Promise<Enrollment[]>;

  /**
   * Find enrollments with pagination
   */
  findAllPaginated(page: number, limit: number, filters?: EnrollmentFilters): Promise<PaginatedEnrollments>;

  /**
   * Count enrollments for a course
   */
  countByCourse(courseId: CourseId, status?: EnrollmentStatus): Promise<number>;

  /**
   * Count enrollments for a student
   */
  countByStudent(studentId: UserId, status?: EnrollmentStatus): Promise<number>;

  /**
   * Count all enrollments with optional status filter
   */
  countAll(status?: EnrollmentStatus): Promise<number>;

  /**
   * Find recent enrollments with course info
   */
  findRecent(limit: number): Promise<Enrollment[]>;
}
