import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { CreateModuleCommand } from './CreateModuleCommand.ts';
import { type ICourseRepository } from '../../../domain/repositories/ICourseRepository.ts';
import { CourseId } from '../../../domain/value-objects/CourseId.ts';
import { Module } from '../../../domain/entities/Module.ts';
import { type ModuleDto } from '../../dtos/CourseDto.ts';

/**
 * CreateModuleHandler
 * Handles creating a new module in a course
 */
export class CreateModuleHandler implements ICommandHandler<CreateModuleCommand, ModuleDto> {
  constructor(private courseRepository: ICourseRepository) {}

  async execute(command: CreateModuleCommand): Promise<Result<ModuleDto>> {
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

    // Calculate next order
    const nextOrder = course.getModuleCount() + 1;

    // Create module
    const moduleResult = Module.create(
      courseIdResult.getValue(),
      command.title,
      nextOrder,
      command.description
    );

    if (moduleResult.isFailure) {
      return Result.fail(moduleResult.getError() as string);
    }

    const module = moduleResult.getValue();

    // Add module to course
    const addResult = course.addModule(module);
    if (addResult.isFailure) {
      return Result.fail(addResult.getError() as string);
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
    const dto: ModuleDto = {
      id: module.getId().toValue(),
      courseId: module.getCourseId().toValue(),
      title: module.getTitle(),
      description: module.getDescription(),
      order: module.getOrder(),
      lessons: [],
      exerciseCorrectionPrompt: module.getExerciseCorrectionPrompt(),
      createdAt: module.getCreatedAt().toISOString(),
      updatedAt: module.getUpdatedAt().toISOString(),
    };

    return Result.ok(dto);
  }
}
