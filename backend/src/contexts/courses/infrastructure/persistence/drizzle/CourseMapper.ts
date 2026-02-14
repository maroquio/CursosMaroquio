import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { Course } from '../../../domain/entities/Course.ts';
import { Module } from '../../../domain/entities/Module.ts';
import { Lesson } from '../../../domain/entities/Lesson.ts';
import { Section, type SectionContent } from '../../../domain/entities/Section.ts';
import { SectionProgress } from '../../../domain/entities/SectionProgress.ts';
import { CourseId } from '../../../domain/value-objects/CourseId.ts';
import { ModuleId } from '../../../domain/value-objects/ModuleId.ts';
import { LessonId } from '../../../domain/value-objects/LessonId.ts';
import { SectionId } from '../../../domain/value-objects/SectionId.ts';
import { SectionProgressId } from '../../../domain/value-objects/SectionProgressId.ts';
import { EnrollmentId } from '../../../domain/value-objects/EnrollmentId.ts';
import { Slug } from '../../../domain/value-objects/Slug.ts';
import { CourseStatus, parseCourseStatus } from '../../../domain/value-objects/CourseStatus.ts';
import { SectionContentType, parseSectionContentType } from '../../../domain/value-objects/SectionContentType.ts';
import { LessonProgressStatus, parseLessonProgressStatus } from '../../../domain/value-objects/LessonProgressStatus.ts';
import { LessonType, parseLessonType } from '../../../domain/value-objects/LessonType.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { type CourseSchema, type ModuleSchema, type LessonSchema, type SectionSchema, type SectionProgressSchema } from './schema.ts';

/**
 * CourseMapper
 * Converts between Course aggregate and database schema
 */
export class CourseMapper {
  /**
   * Convert Course aggregate to database row
   */
  public static toPersistence(course: Course) {
    return {
      id: course.getId().toValue(),
      title: course.getTitle(),
      slug: course.getSlug().getValue(),
      description: course.getDescription(),
      thumbnailUrl: course.getThumbnailUrl(),
      bannerUrl: course.getBannerUrl(),
      shortDescription: course.getShortDescription(),
      price: course.getPrice(),
      currency: course.getCurrency(),
      level: course.getLevel(),
      categoryId: course.getCategoryId(),
      tags: course.getTags(),
      status: course.getStatus(),
      instructorId: course.getInstructorId().toValue(),
      createdAt: course.getCreatedAt(),
      updatedAt: course.getUpdatedAt(),
      publishedAt: course.getPublishedAt(),
      exerciseCorrectionPrompt: course.getExerciseCorrectionPrompt(),
    };
  }

  /**
   * Convert database row to Course aggregate
   */
  public static toDomain(raw: CourseSchema, modules: Module[] = []): Result<Course> {
    const courseIdResult = CourseId.createFromString(raw.id);
    if (courseIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_COURSE_ID);
    }

    const slugResult = Slug.create(raw.slug);
    if (slugResult.isFailure) {
      return Result.fail(ErrorCode.SLUG_INVALID_FORMAT);
    }

    const instructorIdResult = UserId.createFromString(raw.instructorId);
    if (instructorIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_USER_ID);
    }

    const status = parseCourseStatus(raw.status);
    if (!status) {
      return Result.fail(ErrorCode.VALIDATION_ERROR);
    }

    const course = Course.reconstruct(
      courseIdResult.getValue(),
      raw.title,
      slugResult.getValue(),
      raw.description,
      raw.thumbnailUrl,
      raw.bannerUrl,
      raw.shortDescription,
      raw.price,
      raw.currency,
      raw.level,
      raw.categoryId,
      raw.tags ?? [],
      status,
      instructorIdResult.getValue(),
      modules,
      raw.createdAt,
      raw.updatedAt,
      raw.publishedAt,
      raw.exerciseCorrectionPrompt ?? null
    );

    return Result.ok(course);
  }

  /**
   * Convert Module entity to database row
   */
  public static moduleToPersistence(module: Module) {
    return {
      id: module.getId().toValue(),
      courseId: module.getCourseId().toValue(),
      title: module.getTitle(),
      description: module.getDescription(),
      order: module.getOrder(),
      createdAt: module.getCreatedAt(),
      updatedAt: module.getUpdatedAt(),
      exerciseCorrectionPrompt: module.getExerciseCorrectionPrompt(),
    };
  }

  /**
   * Convert database row to Module entity
   */
  public static moduleToDomain(raw: ModuleSchema, lessons: Lesson[] = []): Result<Module> {
    const moduleIdResult = ModuleId.createFromString(raw.id);
    if (moduleIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_MODULE_ID);
    }

    const courseIdResult = CourseId.createFromString(raw.courseId);
    if (courseIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_COURSE_ID);
    }

    const module = Module.reconstruct(
      moduleIdResult.getValue(),
      courseIdResult.getValue(),
      raw.title,
      raw.description,
      raw.order,
      lessons,
      raw.createdAt,
      raw.updatedAt,
      raw.exerciseCorrectionPrompt ?? null
    );

    return Result.ok(module);
  }

  /**
   * Convert Lesson entity to database row
   */
  public static lessonToPersistence(lesson: Lesson) {
    return {
      id: lesson.getId().toValue(),
      moduleId: lesson.getModuleId().toValue(),
      title: lesson.getTitle(),
      slug: lesson.getSlug(),
      description: lesson.getDescription(),
      content: lesson.getContent(),
      videoUrl: lesson.getVideoUrl(),
      duration: lesson.getDuration(),
      type: lesson.getType(),
      isFree: lesson.getIsFree(),
      isPublished: lesson.getIsPublished(),
      order: lesson.getOrder(),
      createdAt: lesson.getCreatedAt(),
      updatedAt: lesson.getUpdatedAt(),
      exerciseCorrectionPrompt: lesson.getExerciseCorrectionPrompt(),
    };
  }

  /**
   * Convert database row to Lesson entity
   */
  public static lessonToDomain(raw: LessonSchema, sections: Section[] = []): Result<Lesson> {
    const lessonIdResult = LessonId.createFromString(raw.id);
    if (lessonIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_LESSON_ID);
    }

    const moduleIdResult = ModuleId.createFromString(raw.moduleId);
    if (moduleIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_MODULE_ID);
    }

    const lessonType = parseLessonType(raw.type);
    if (!lessonType) {
      return Result.fail(ErrorCode.VALIDATION_ERROR);
    }

    const lesson = Lesson.reconstruct(
      lessonIdResult.getValue(),
      moduleIdResult.getValue(),
      raw.title,
      raw.slug,
      raw.description,
      raw.content,
      raw.videoUrl,
      raw.duration,
      lessonType,
      raw.isFree,
      raw.isPublished,
      raw.order,
      sections,
      raw.createdAt,
      raw.updatedAt,
      raw.exerciseCorrectionPrompt ?? null
    );

    return Result.ok(lesson);
  }

  /**
   * Convert Section entity to database row
   */
  public static sectionToPersistence(section: Section) {
    return {
      id: section.getId().toValue(),
      lessonId: section.getLessonId().toValue(),
      title: section.getTitle(),
      description: section.getDescription(),
      contentType: section.getContentType(),
      content: section.getContent(),
      order: section.getOrder(),
      createdAt: section.getCreatedAt(),
      updatedAt: section.getUpdatedAt(),
    };
  }

  /**
   * Convert database row to Section entity
   */
  public static sectionToDomain(raw: SectionSchema): Result<Section> {
    const sectionIdResult = SectionId.createFromString(raw.id);
    if (sectionIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_SECTION_ID);
    }

    const lessonIdResult = LessonId.createFromString(raw.lessonId);
    if (lessonIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_LESSON_ID);
    }

    const contentType = parseSectionContentType(raw.contentType);
    if (!contentType) {
      return Result.fail(ErrorCode.SECTION_INVALID_CONTENT_TYPE);
    }

    // Parse content from JSONB (comes as object from Drizzle)
    const content = raw.content as SectionContent;

    const section = Section.reconstruct(
      sectionIdResult.getValue(),
      lessonIdResult.getValue(),
      raw.title,
      raw.description,
      contentType,
      content,
      raw.order,
      raw.createdAt,
      raw.updatedAt
    );

    return Result.ok(section);
  }

  /**
   * Convert SectionProgress entity to database row
   */
  public static sectionProgressToPersistence(progress: SectionProgress) {
    return {
      id: progress.getId().toValue(),
      enrollmentId: progress.getEnrollmentId().toValue(),
      sectionId: progress.getSectionId().toValue(),
      status: progress.getStatus(),
      completedAt: progress.getCompletedAt(),
      lastViewedAt: progress.getLastViewedAt(),
    };
  }

  /**
   * Convert database row to SectionProgress entity
   */
  public static sectionProgressToDomain(raw: SectionProgressSchema): Result<SectionProgress> {
    const progressIdResult = SectionProgressId.createFromString(raw.id);
    if (progressIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_SECTION_PROGRESS_ID);
    }

    const enrollmentIdResult = EnrollmentId.createFromString(raw.enrollmentId);
    if (enrollmentIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_ENROLLMENT_ID);
    }

    const sectionIdResult = SectionId.createFromString(raw.sectionId);
    if (sectionIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_SECTION_ID);
    }

    const status = parseLessonProgressStatus(raw.status);
    if (!status) {
      return Result.fail(ErrorCode.VALIDATION_ERROR);
    }

    const progress = SectionProgress.reconstruct(
      progressIdResult.getValue(),
      enrollmentIdResult.getValue(),
      sectionIdResult.getValue(),
      status,
      raw.completedAt,
      raw.lastViewedAt
    );

    return Result.ok(progress);
  }
}
