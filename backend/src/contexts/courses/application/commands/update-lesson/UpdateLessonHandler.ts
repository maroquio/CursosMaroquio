import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { UpdateLessonCommand } from './UpdateLessonCommand.ts';
import { type IModuleRepository } from '../../../domain/repositories/IModuleRepository.ts';
import { LessonId } from '../../../domain/value-objects/LessonId.ts';
import { type LessonDto } from '../../dtos/CourseDto.ts';

/**
 * UpdateLessonHandler
 * Handles updating a lesson
 */
export class UpdateLessonHandler implements ICommandHandler<UpdateLessonCommand, LessonDto> {
  constructor(private moduleRepository: IModuleRepository) {}

  async execute(command: UpdateLessonCommand): Promise<Result<LessonDto>> {
    // Validate lesson ID
    const lessonIdResult = LessonId.createFromString(command.lessonId);
    if (lessonIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_LESSON_ID);
    }
    const lessonId = lessonIdResult.getValue();

    // Find module containing the lesson
    const module = await this.moduleRepository.findByLessonId(lessonId);
    if (!module) {
      return Result.fail(ErrorCode.LESSON_NOT_FOUND);
    }

    // Find the lesson
    const lesson = module.findLesson(lessonId);
    if (!lesson) {
      return Result.fail(ErrorCode.LESSON_NOT_FOUND);
    }

    // Update fields if provided
    if (command.title !== undefined) {
      const titleResult = lesson.updateTitle(command.title);
      if (titleResult.isFailure) {
        return Result.fail(titleResult.getError() as string);
      }
    }

    if (command.description !== undefined) {
      lesson.updateDescription(command.description);
    }

    if (command.videoUrl !== undefined) {
      lesson.updateVideoUrl(command.videoUrl);
    }

    if (command.duration !== undefined) {
      lesson.updateDuration(command.duration);
    }

    // Update exerciseCorrectionPrompt if provided
    if (command.exerciseCorrectionPrompt !== undefined) {
      lesson.updateExerciseCorrectionPrompt(command.exerciseCorrectionPrompt);
    }

    // Persist
    try {
      await this.moduleRepository.save(module);
    } catch (error) {
      return Result.fail(ErrorCode.INTERNAL_ERROR);
    }

    // Publish domain events
    const eventPublisher = getDomainEventPublisher();
    await eventPublisher.publishEventsForAggregate(module);

    // Return DTO
    const dto: LessonDto = {
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
      exerciseCorrectionPrompt: lesson.getExerciseCorrectionPrompt(),
      sections: lesson.getSections().map(section => ({
        id: section.getId().toValue(),
        lessonId: section.getLessonId().toValue(),
        title: section.getTitle(),
        description: section.getDescription(),
        contentType: section.getContentType(),
        content: section.getContent(),
        order: section.getOrder(),
        createdAt: section.getCreatedAt().toISOString(),
        updatedAt: section.getUpdatedAt().toISOString(),
      })),
      createdAt: lesson.getCreatedAt().toISOString(),
      updatedAt: lesson.getUpdatedAt().toISOString(),
    };

    return Result.ok(dto);
  }
}
