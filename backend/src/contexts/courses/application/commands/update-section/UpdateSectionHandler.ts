import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { getDomainEventPublisher } from '@shared/domain/events/DomainEventPublisher.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { UpdateSectionCommand } from './UpdateSectionCommand.ts';
import { type ISectionRepository } from '../../../domain/repositories/ISectionRepository.ts';
import { SectionId } from '../../../domain/value-objects/SectionId.ts';
import { type SectionDto } from '../../dtos/CourseDto.ts';

/**
 * UpdateSectionHandler
 * Handles updating a section's information
 */
export class UpdateSectionHandler implements ICommandHandler<UpdateSectionCommand, SectionDto> {
  constructor(private sectionRepository: ISectionRepository) {}

  async execute(command: UpdateSectionCommand): Promise<Result<SectionDto>> {
    // Validate section ID
    const sectionIdResult = SectionId.createFromString(command.sectionId);
    if (sectionIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_SECTION_ID);
    }

    // Find section
    const section = await this.sectionRepository.findById(sectionIdResult.getValue());
    if (!section) {
      return Result.fail(ErrorCode.SECTION_NOT_FOUND);
    }

    // Update title if provided
    if (command.title !== undefined) {
      const updateResult = section.updateTitle(command.title);
      if (updateResult.isFailure) {
        return Result.fail(updateResult.getError() as string);
      }
    }

    // Update description if provided
    if (command.description !== undefined) {
      section.updateDescription(command.description);
    }

    // Update content type if provided
    if (command.contentType !== undefined) {
      section.updateContentType(command.contentType);
    }

    // Update content if provided
    if (command.content !== undefined) {
      section.updateContent(command.content);
    }

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
