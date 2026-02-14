import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { ReorderLessonsCommand } from './ReorderLessonsCommand.ts';
import { type IModuleRepository } from '../../../domain/repositories/IModuleRepository.ts';
import { ModuleId } from '../../../domain/value-objects/ModuleId.ts';
import { LessonId } from '../../../domain/value-objects/LessonId.ts';

/**
 * ReorderLessonsHandler
 * Handles reordering lessons within a module
 */
export class ReorderLessonsHandler implements ICommandHandler<ReorderLessonsCommand, void> {
  constructor(private moduleRepository: IModuleRepository) {}

  async execute(command: ReorderLessonsCommand): Promise<Result<void>> {
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

    // Parse and validate lesson IDs
    const lessonIds: LessonId[] = [];
    // Sort by order first, then extract IDs
    const sortedLessons = [...command.lessons].sort((a, b) => a.order - b.order);

    for (const item of sortedLessons) {
      const lessonIdResult = LessonId.createFromString(item.id);
      if (lessonIdResult.isFailure) {
        return Result.fail(ErrorCode.INVALID_LESSON_ID);
      }
      lessonIds.push(lessonIdResult.getValue());
    }

    // Reorder lessons
    const reorderResult = module.reorderLessons(lessonIds);
    if (reorderResult.isFailure) {
      return Result.fail(reorderResult.getError() as string);
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
