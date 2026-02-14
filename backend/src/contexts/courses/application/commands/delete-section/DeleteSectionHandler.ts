import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { DeleteSectionCommand } from './DeleteSectionCommand.ts';
import { type ISectionRepository } from '../../../domain/repositories/ISectionRepository.ts';
import { SectionId } from '../../../domain/value-objects/SectionId.ts';

/**
 * DeleteSectionHandler
 * Handles deleting a section from a lesson
 */
export class DeleteSectionHandler implements ICommandHandler<DeleteSectionCommand, void> {
  constructor(private sectionRepository: ISectionRepository) {}

  async execute(command: DeleteSectionCommand): Promise<Result<void>> {
    // Validate section ID
    const sectionIdResult = SectionId.createFromString(command.sectionId);
    if (sectionIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_SECTION_ID);
    }

    // Find section to verify it exists
    const section = await this.sectionRepository.findById(sectionIdResult.getValue());
    if (!section) {
      return Result.fail(ErrorCode.SECTION_NOT_FOUND);
    }

    // Delete section
    try {
      await this.sectionRepository.delete(sectionIdResult.getValue());
    } catch (error) {
      return Result.fail(ErrorCode.INTERNAL_ERROR);
    }

    return Result.ok(undefined);
  }
}
