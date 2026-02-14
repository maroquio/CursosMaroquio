import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { GetCourseQuery } from './GetCourseQuery.ts';
import { type ICourseRepository } from '../../../domain/repositories/ICourseRepository.ts';
import { type IEnrollmentRepository } from '../../../domain/repositories/IEnrollmentRepository.ts';
import { CourseId } from '../../../domain/value-objects/CourseId.ts';
import { Slug } from '../../../domain/value-objects/Slug.ts';
import { type CourseWithLessonsDto, type ModuleDto, type LessonDto, type SectionDto } from '../../dtos/CourseDto.ts';

/**
 * GetCourseHandler
 * Handles retrieving a course by ID or slug
 */
export class GetCourseHandler implements IQueryHandler<GetCourseQuery, CourseWithLessonsDto> {
  constructor(
    private courseRepository: ICourseRepository,
    private enrollmentRepository: IEnrollmentRepository
  ) {}

  async execute(query: GetCourseQuery): Promise<Result<CourseWithLessonsDto>> {
    let course;

    if (query.courseId) {
      const courseIdResult = CourseId.createFromString(query.courseId);
      if (courseIdResult.isFailure) {
        return Result.fail(ErrorCode.INVALID_COURSE_ID);
      }
      course = await this.courseRepository.findById(courseIdResult.getValue());
    } else if (query.slug) {
      const slugResult = Slug.create(query.slug);
      if (slugResult.isFailure) {
        return Result.fail(ErrorCode.SLUG_INVALID_FORMAT);
      }
      course = await this.courseRepository.findBySlug(slugResult.getValue());
    } else {
      return Result.fail(ErrorCode.VALIDATION_ERROR);
    }

    if (!course) {
      return Result.fail(ErrorCode.COURSE_NOT_FOUND);
    }

    // Get total enrollments count
    const totalEnrollments = await this.enrollmentRepository.countByCourse(course.getId());

    // Map modules with lessons and sections to DTOs
    const modules: ModuleDto[] = course.getModules().map(module => {
      const lessons: LessonDto[] = module.getLessons().map(lesson => {
        const sections: SectionDto[] = lesson.getSections().map(section => ({
          id: section.getId().toValue(),
          lessonId: section.getLessonId().toValue(),
          title: section.getTitle(),
          description: section.getDescription(),
          contentType: section.getContentType(),
          content: section.getContent(),
          order: section.getOrder(),
          createdAt: section.getCreatedAt().toISOString(),
          updatedAt: section.getUpdatedAt().toISOString(),
        }));

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
          sections,
          exerciseCorrectionPrompt: lesson.getExerciseCorrectionPrompt(),
          createdAt: lesson.getCreatedAt().toISOString(),
          updatedAt: lesson.getUpdatedAt().toISOString(),
        };
      });

      return {
        id: module.getId().toValue(),
        courseId: module.getCourseId().toValue(),
        title: module.getTitle(),
        description: module.getDescription(),
        order: module.getOrder(),
        lessons,
        exerciseCorrectionPrompt: module.getExerciseCorrectionPrompt(),
        createdAt: module.getCreatedAt().toISOString(),
        updatedAt: module.getUpdatedAt().toISOString(),
      };
    });

    // Return DTO
    const dto: CourseWithLessonsDto = {
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
      totalLessons: course.getLessonCount(),
      totalEnrollments,
      totalDuration: course.getTotalDuration(),
      exerciseCorrectionPrompt: course.getExerciseCorrectionPrompt(),
      createdAt: course.getCreatedAt().toISOString(),
      updatedAt: course.getUpdatedAt().toISOString(),
      publishedAt: course.getPublishedAt()?.toISOString() ?? null,
      modules,
    };

    return Result.ok(dto);
  }
}
