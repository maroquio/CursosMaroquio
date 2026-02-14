import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { UpdateModuleCommand } from './UpdateModuleCommand.ts';
import { type IModuleRepository } from '../../../domain/repositories/IModuleRepository.ts';
import { ModuleId } from '../../../domain/value-objects/ModuleId.ts';
import { type ModuleDto, type LessonDto, type SectionDto } from '../../dtos/CourseDto.ts';

/**
 * UpdateModuleHandler
 * Handles updating a module's information
 */
export class UpdateModuleHandler implements ICommandHandler<UpdateModuleCommand, ModuleDto> {
  constructor(private moduleRepository: IModuleRepository) {}

  async execute(command: UpdateModuleCommand): Promise<Result<ModuleDto>> {
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

    // Update title if provided
    if (command.title !== undefined) {
      const updateResult = module.updateTitle(command.title);
      if (updateResult.isFailure) {
        return Result.fail(updateResult.getError() as string);
      }
    }

    // Update description if provided
    if (command.description !== undefined) {
      module.updateDescription(command.description);
    }

    // Update exerciseCorrectionPrompt if provided
    if (command.exerciseCorrectionPrompt !== undefined) {
      module.updateExerciseCorrectionPrompt(command.exerciseCorrectionPrompt);
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

    // Map lessons to DTOs
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

    // Return DTO
    const dto: ModuleDto = {
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

    return Result.ok(dto);
  }
}
