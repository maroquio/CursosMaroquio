import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { ReorderModulesCommand } from './ReorderModulesCommand.ts';
import { type ICourseRepository } from '../../../domain/repositories/ICourseRepository.ts';
import { CourseId } from '../../../domain/value-objects/CourseId.ts';
import { ModuleId } from '../../../domain/value-objects/ModuleId.ts';

/**
 * ReorderModulesHandler
 * Handles reordering modules in a course
 */
export class ReorderModulesHandler implements ICommandHandler<ReorderModulesCommand, void> {
  constructor(private courseRepository: ICourseRepository) {}

  async execute(command: ReorderModulesCommand): Promise<Result<void>> {
    // Validate course ID
    const courseIdResult = CourseId.createFromString(command.courseId);
    if (courseIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_COURSE_ID);
    }

    // Validate module IDs and collect with orders
    const moduleOrders: Array<{ id: ModuleId; order: number }> = [];
    for (const module of command.modules) {
      const moduleIdResult = ModuleId.createFromString(module.id);
      if (moduleIdResult.isFailure) {
        return Result.fail(ErrorCode.INVALID_MODULE_ID);
      }
      moduleOrders.push({ id: moduleIdResult.getValue(), order: module.order });
    }

    // Find course
    const course = await this.courseRepository.findById(courseIdResult.getValue());
    if (!course) {
      return Result.fail(ErrorCode.COURSE_NOT_FOUND);
    }

    // Sort by desired order and extract IDs
    moduleOrders.sort((a, b) => a.order - b.order);
    const sortedModuleIds = moduleOrders.map(m => m.id);

    // Reorder modules
    const reorderResult = course.reorderModules(sortedModuleIds);
    if (reorderResult.isFailure) {
      return Result.fail(reorderResult.getError() as string);
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

    return Result.ok(undefined);
  }
}
