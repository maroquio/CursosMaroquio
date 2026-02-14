import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { UpdateCourseCommand } from './UpdateCourseCommand.ts';
import { type ICourseRepository } from '../../../domain/repositories/ICourseRepository.ts';
import { CourseId } from '../../../domain/value-objects/CourseId.ts';
import { Slug } from '../../../domain/value-objects/Slug.ts';
import { type CourseDto } from '../../dtos/CourseDto.ts';

/**
 * UpdateCourseHandler
 * Handles course updates
 */
export class UpdateCourseHandler implements ICommandHandler<UpdateCourseCommand, CourseDto> {
  constructor(private courseRepository: ICourseRepository) {}

  async execute(command: UpdateCourseCommand): Promise<Result<CourseDto>> {
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

    // Update title if provided
    if (command.title !== undefined) {
      const updateTitleResult = course.updateTitle(command.title);
      if (updateTitleResult.isFailure) {
        return Result.fail(updateTitleResult.getError() as string);
      }

      // Generate new slug
      const slugResult = Slug.fromTitle(command.title);
      if (slugResult.isOk) {
        const newSlug = slugResult.getValue();
        // Only update slug if it changed
        if (!course.getSlug().equals(newSlug)) {
          // Check if new slug already exists
          const existingCourse = await this.courseRepository.findBySlug(newSlug);
          if (existingCourse && !existingCourse.getId().equals(course.getId())) {
            return Result.fail(ErrorCode.SLUG_ALREADY_EXISTS);
          }
          course.updateSlug(newSlug);
        }
      }
    }

    // Update description if provided
    if (command.description !== undefined) {
      const updateDescResult = course.updateDescription(command.description);
      if (updateDescResult.isFailure) {
        return Result.fail(updateDescResult.getError() as string);
      }
    }

    // Update thumbnail if provided
    if (command.thumbnailUrl !== undefined) {
      course.updateThumbnailUrl(command.thumbnailUrl);
    }

    // Update short description if provided
    if (command.shortDescription !== undefined) {
      course.updateShortDescription(command.shortDescription);
    }

    // Update price if provided
    if (command.price !== undefined) {
      course.updatePrice(command.price);
    }

    // Update currency if provided
    if (command.currency !== undefined) {
      course.updateCurrency(command.currency);
    }

    // Update level if provided
    if (command.level !== undefined) {
      course.updateLevel(command.level);
    }

    // Update categoryId if provided
    if (command.categoryId !== undefined) {
      course.updateCategoryId(command.categoryId);
    }

    // Update tags if provided
    if (command.tags !== undefined) {
      course.updateTags(command.tags);
    }

    // Update exerciseCorrectionPrompt if provided
    if (command.exerciseCorrectionPrompt !== undefined) {
      course.updateExerciseCorrectionPrompt(command.exerciseCorrectionPrompt);
    }

    // Persist
    try {
      await this.courseRepository.save(course);
    } catch (error) {
      return Result.fail(ErrorCode.INTERNAL_ERROR);
    }

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
