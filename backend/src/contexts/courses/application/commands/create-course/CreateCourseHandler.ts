import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { CreateCourseCommand } from './CreateCourseCommand.ts';
import { type ICourseRepository } from '../../../domain/repositories/ICourseRepository.ts';
import { Course } from '../../../domain/entities/Course.ts';
import { Slug } from '../../../domain/value-objects/Slug.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { type CourseDto } from '../../dtos/CourseDto.ts';

/**
 * CreateCourseHandler
 * Handles course creation
 */
export class CreateCourseHandler implements ICommandHandler<CreateCourseCommand, CourseDto> {
  constructor(private courseRepository: ICourseRepository) {}

  async execute(command: CreateCourseCommand): Promise<Result<CourseDto>> {
    // Validate instructor ID
    const instructorIdResult = UserId.createFromString(command.instructorId);
    if (instructorIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_USER_ID);
    }

    // Generate slug from title
    const slugResult = Slug.fromTitle(command.title);
    if (slugResult.isFailure) {
      return Result.fail(slugResult.getError() as string);
    }
    const slug = slugResult.getValue();

    // Check if slug already exists
    const slugExists = await this.courseRepository.existsBySlug(slug);
    if (slugExists) {
      return Result.fail(ErrorCode.SLUG_ALREADY_EXISTS);
    }

    // Create course
    const courseResult = Course.create(
      command.title,
      slug,
      instructorIdResult.getValue(),
      command.description,
      command.thumbnailUrl,
      command.bannerUrl,
      command.shortDescription,
      command.price,
      command.currency,
      command.level,
      command.categoryId,
      command.tags
    );

    if (courseResult.isFailure) {
      return Result.fail(courseResult.getError() as string);
    }

    const course = courseResult.getValue();

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
