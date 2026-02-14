import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { AddLessonCommand } from './AddLessonCommand.ts';
import { type IModuleRepository } from '../../../domain/repositories/IModuleRepository.ts';
import { ModuleId } from '../../../domain/value-objects/ModuleId.ts';
import { Lesson } from '../../../domain/entities/Lesson.ts';
import { type LessonDto } from '../../dtos/CourseDto.ts';

/**
 * AddLessonHandler
 * Handles adding a lesson to a module
 */
export class AddLessonHandler implements ICommandHandler<AddLessonCommand, LessonDto> {
  constructor(private moduleRepository: IModuleRepository) {}

  async execute(command: AddLessonCommand): Promise<Result<LessonDto>> {
    // Validate module ID
    const moduleIdResult = ModuleId.createFromString(command.moduleId);
    if (moduleIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_MODULE_ID);
    }

    // Find module
    const module = await this.moduleRepository.findById(moduleIdResult.getValue());
    if (!module) {
      return Result.fail(ErrorCode.MODULE_NOT_FOUND);
    }

    // Calculate next order
    const nextOrder = module.getLessonCount() + 1;

    // Create lesson
    const lessonResult = Lesson.create(
      moduleIdResult.getValue(),
      command.title,
      command.slug,
      nextOrder,
      command.description,
      command.content,
      command.videoUrl,
      command.duration,
      command.type,
      command.isFree,
      command.isPublished
    );

    if (lessonResult.isFailure) {
      return Result.fail(lessonResult.getError() as string);
    }

    const lesson = lessonResult.getValue();

    // Add lesson to module
    const addResult = module.addLesson(lesson);
    if (addResult.isFailure) {
      return Result.fail(addResult.getError() as string);
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
      exerciseCorrectionPrompt: lesson.getExerciseCorrectionPrompt(),
      order: lesson.getOrder(),
      sections: [],
      createdAt: lesson.getCreatedAt().toISOString(),
      updatedAt: lesson.getUpdatedAt().toISOString(),
    };

    return Result.ok(dto);
  }
}
