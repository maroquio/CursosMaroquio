import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { DeleteLessonCommand } from './DeleteLessonCommand.ts';
import { type IModuleRepository } from '../../../domain/repositories/IModuleRepository.ts';
import { ModuleId } from '../../../domain/value-objects/ModuleId.ts';
import { LessonId } from '../../../domain/value-objects/LessonId.ts';

/**
 * DeleteLessonHandler
 * Handles deleting a lesson from a module
 */
export class DeleteLessonHandler implements ICommandHandler<DeleteLessonCommand, void> {
  constructor(private moduleRepository: IModuleRepository) {}

  async execute(command: DeleteLessonCommand): Promise<Result<void>> {
    // Validate module ID
    const moduleIdResult = ModuleId.createFromString(command.moduleId);
    if (moduleIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_MODULE_ID);
    }

    // Validate lesson ID
    const lessonIdResult = LessonId.createFromString(command.lessonId);
    if (lessonIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_LESSON_ID);
    }

    // Find module
    const module = await this.moduleRepository.findById(moduleIdResult.getValue());
    if (!module) {
      return Result.fail(ErrorCode.MODULE_NOT_FOUND);
    }

    // Remove lesson from module
    const removeResult = module.removeLesson(lessonIdResult.getValue());
    if (removeResult.isFailure) {
      return Result.fail(removeResult.getError() as string);
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

    return Result.ok(undefined);
  }
}
