import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { ReorderSectionsCommand } from './ReorderSectionsCommand.ts';
import { type ISectionRepository } from '../../../domain/repositories/ISectionRepository.ts';
import { LessonId } from '../../../domain/value-objects/LessonId.ts';
import { SectionId } from '../../../domain/value-objects/SectionId.ts';

/**
 * ReorderSectionsHandler
 * Handles reordering sections in a lesson
 */
export class ReorderSectionsHandler implements ICommandHandler<ReorderSectionsCommand, void> {
  constructor(private sectionRepository: ISectionRepository) {}

  async execute(command: ReorderSectionsCommand): Promise<Result<void>> {
    // Validate lesson ID
    const lessonIdResult = LessonId.createFromString(command.lessonId);
    if (lessonIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_LESSON_ID);
    }

    // Validate section IDs and gather sections
    for (const sectionOrder of command.sections) {
      const sectionIdResult = SectionId.createFromString(sectionOrder.id);
      if (sectionIdResult.isFailure) {
        return Result.fail(ErrorCode.INVALID_SECTION_ID);
      }

      // Find and update each section
      const section = await this.sectionRepository.findById(sectionIdResult.getValue());
      if (!section) {
        return Result.fail(ErrorCode.SECTION_NOT_FOUND);
      }

      // Verify section belongs to the lesson
      if (!section.getLessonId().equals(lessonIdResult.getValue())) {
        return Result.fail(ErrorCode.SECTION_NOT_FOUND);
      }

      // Update order
      section.updateOrder(sectionOrder.order);

      // Persist
      try {
        await this.sectionRepository.save(section);
      } catch (error) {
        return Result.fail(ErrorCode.INTERNAL_ERROR);
      }
    }

    return Result.ok(undefined);
  }
}
