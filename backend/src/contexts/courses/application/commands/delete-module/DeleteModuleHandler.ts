import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { DeleteModuleCommand } from './DeleteModuleCommand.ts';
import { type ICourseRepository } from '../../../domain/repositories/ICourseRepository.ts';
import { CourseId } from '../../../domain/value-objects/CourseId.ts';
import { ModuleId } from '../../../domain/value-objects/ModuleId.ts';

/**
 * DeleteModuleHandler
 * Handles deleting a module from a course
 */
export class DeleteModuleHandler implements ICommandHandler<DeleteModuleCommand, void> {
  constructor(private courseRepository: ICourseRepository) {}

  async execute(command: DeleteModuleCommand): Promise<Result<void>> {
    // Validate course ID
    const courseIdResult = CourseId.createFromString(command.courseId);
    if (courseIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_COURSE_ID);
    }

    // Validate module ID
    const moduleIdResult = ModuleId.createFromString(command.moduleId);
    if (moduleIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_MODULE_ID);
    }

    // Find course
    const course = await this.courseRepository.findById(courseIdResult.getValue());
    if (!course) {
      return Result.fail(ErrorCode.COURSE_NOT_FOUND);
    }

    // Remove module from course
    const removeResult = course.removeModule(moduleIdResult.getValue());
    if (removeResult.isFailure) {
      return Result.fail(removeResult.getError() as string);
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
