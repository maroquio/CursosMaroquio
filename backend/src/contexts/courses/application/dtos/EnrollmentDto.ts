import { EnrollmentStatus } from '../../domain/value-objects/EnrollmentStatus.ts';
import { LessonProgressStatus } from '../../domain/value-objects/LessonProgressStatus.ts';

/**
 * Enrollment DTO for read operations
 */
export interface EnrollmentDto {
  id: string;
  courseId: string;
  studentId: string;
  status: EnrollmentStatus;
  progress: number;
  enrolledAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
}

/**
 * Enrollment with course info DTO
 */
export interface EnrollmentWithCourseDto extends EnrollmentDto {
  courseTitle: string;
  courseSlug: string;
  courseThumbnailUrl: string | null;
  totalLessons: number;
  completedLessons: number;
}

/**
 * Paginated enrollments response
 */
export interface PaginatedEnrollmentsDto {
  enrollments: EnrollmentDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Lesson progress DTO
 */
export interface LessonProgressDto {
  id: string;
  enrollmentId: string;
  lessonId: string;
  lessonTitle: string;
  lessonOrder: number;
  status: LessonProgressStatus;
  watchedSeconds: number;
  lessonDuration: number;
  completedAt: string | null;
  lastWatchedAt: string | null;
}

/**
 * Section progress DTO
 */
export interface SectionProgressDto {
  id: string;
  enrollmentId: string;
  sectionId: string;
  status: LessonProgressStatus;
  completedAt: string | null;
  lastViewedAt: string | null;
}

/**
 * Course progress DTO
 */
export interface CourseProgressDto {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  overallProgress: number;
  lessonsProgress: LessonProgressDto[];
  completedLessons: number;
  totalLessons: number;
}
