import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { UnpublishCourseCommand } from './UnpublishCourseCommand.ts';
import { type ICourseRepository } from '../../../domain/repositories/ICourseRepository.ts';
import { CourseId } from '../../../domain/value-objects/CourseId.ts';
import { type CourseDto } from '../../dtos/CourseDto.ts';

/**
 * UnpublishCourseHandler
 * Handles course unpublication
 */
export class UnpublishCourseHandler implements ICommandHandler<UnpublishCourseCommand, CourseDto> {
  constructor(private courseRepository: ICourseRepository) {}

  async execute(command: UnpublishCourseCommand): Promise<Result<CourseDto>> {
    // Validate course ID
    const courseIdResult = CourseId.createFromString(command.courseId);
    if (courseIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_COURSE_ID);
    }

    // Find course
    const course = await this.courseRepository.findById(courseIdResult.getValue());
    if (!course) {
      return Result.fail(ErrorCode.COURSE_NOT_FOUND);
    }

    // Unpublish course
    const unpublishResult = course.unpublish();
    if (unpublishResult.isFailure) {
      return Result.fail(unpublishResult.getError() as string);
    }

    // Persist
    try {
      await this.courseRepository.save(course);
    } catch (error) {
      return Result.fail(ErrorCode.INTERNAL_ERROR);
    }

    // Publish domain events
    const eventPublisher = getDomainEventPublisher();
    await eventPublisher.publishEventsForAggregate(course);

    // Return DTO
    const dto: CourseDto = {
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
      totalEnrollments: 0,
      totalDuration: course.getTotalDuration(),
      exerciseCorrectionPrompt: course.getExerciseCorrectionPrompt(),
      createdAt: course.getCreatedAt().toISOString(),
      updatedAt: course.getUpdatedAt().toISOString(),
      publishedAt: course.getPublishedAt()?.toISOString() ?? null,
    };

    return Result.ok(dto);
  }
}
