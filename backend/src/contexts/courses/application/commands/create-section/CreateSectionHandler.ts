import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { CreateSectionCommand } from './CreateSectionCommand.ts';
import { type ISectionRepository } from '../../../domain/repositories/ISectionRepository.ts';
import { LessonId } from '../../../domain/value-objects/LessonId.ts';
import { Section } from '../../../domain/entities/Section.ts';
import { type SectionDto } from '../../dtos/CourseDto.ts';

/**
 * CreateSectionHandler
 * Handles creating a new section in a lesson
 */
export class CreateSectionHandler implements ICommandHandler<CreateSectionCommand, SectionDto> {
  constructor(private sectionRepository: ISectionRepository) {}

  async execute(command: CreateSectionCommand): Promise<Result<SectionDto>> {
    // Validate lesson ID
    const lessonIdResult = LessonId.createFromString(command.lessonId);
    if (lessonIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_LESSON_ID);
    }

    // Calculate next order
    const nextOrder = await this.sectionRepository.getNextOrder(lessonIdResult.getValue());

    // Create section
    const sectionResult = Section.create(
      lessonIdResult.getValue(),
      command.title,
      nextOrder,
      command.contentType,
      command.description ?? undefined,
      command.content
    );

    if (sectionResult.isFailure) {
      return Result.fail(sectionResult.getError() as string);
    }

    const section = sectionResult.getValue();

    // Persist
    try {
      await this.sectionRepository.save(section);
    } catch (error) {
      return Result.fail(ErrorCode.INTERNAL_ERROR);
    }

    // Publish domain events
    const eventPublisher = getDomainEventPublisher();
    await eventPublisher.publishEventsForAggregate(section);

    // Return DTO
    const dto: SectionDto = {
      id: section.getId().toValue(),
      lessonId: section.getLessonId().toValue(),
      title: section.getTitle(),
      description: section.getDescription(),
      contentType: section.getContentType(),
      content: section.getContent(),
      order: section.getOrder(),
      createdAt: section.getCreatedAt().toISOString(),
      updatedAt: section.getUpdatedAt().toISOString(),
    };

    return Result.ok(dto);
  }
}
