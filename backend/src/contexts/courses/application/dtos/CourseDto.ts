import { CourseStatus } from '../../domain/value-objects/CourseStatus.ts';
import { SectionContentType } from '../../domain/value-objects/SectionContentType.ts';
import { LessonType } from '../../domain/value-objects/LessonType.ts';
import { type SectionContent } from '../../domain/entities/Section.ts';

/**
 * Course DTO for read operations
 */
export interface CourseDto {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  bannerUrl: string | null;
  shortDescription: string | null;
  price: number;
  currency: string;
  level: string | null;
  categoryId: string | null;
  tags: string[];
  status: CourseStatus;
  instructorId: string;
  totalLessons: number;
  totalEnrollments: number;
  totalDuration: number;
  exerciseCorrectionPrompt: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

/**
 * Course with modules DTO
 */
export interface CourseWithModulesDto extends CourseDto {
  modules: ModuleDto[];
}

/**
 * @deprecated Use CourseWithModulesDto instead
 */
export interface CourseWithLessonsDto extends CourseDto {
  modules: ModuleDto[];
}

/**
 * Module DTO
 */
export interface ModuleDto {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  order: number;
  lessons: LessonDto[];
  exerciseCorrectionPrompt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Section DTO
 */
export interface SectionDto {
  id: string;
  lessonId: string;
  title: string;
  description: string | null;
  contentType: SectionContentType;
  content: SectionContent;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lesson DTO
 */
export interface LessonDto {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  videoUrl: string | null;
  duration: number;
  type: LessonType;
  isFree: boolean;
  isPublished: boolean;
  order: number;
  sections: SectionDto[];
  exerciseCorrectionPrompt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Paginated courses response
 */
export interface PaginatedCoursesDto {
  courses: CourseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Course statistics DTO
 */
export interface CourseStatsDto {
  courseId: string;
  enrollmentCount: number;
  completedCount: number;
  activeCount: number;
  averageProgress: number;
}
