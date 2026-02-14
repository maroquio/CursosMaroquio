import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { DeleteCategoryCommand } from './DeleteCategoryCommand.ts';
import { type ICategoryRepository } from '../../../domain/repositories/ICategoryRepository.ts';
import { CategoryId } from '../../../domain/value-objects/CategoryId.ts';

/**
 * DeleteCategoryHandler
 * Handles deleting a category
 */
export class DeleteCategoryHandler implements ICommandHandler<DeleteCategoryCommand, void> {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(command: DeleteCategoryCommand): Promise<Result<void>> {
    // Validate category ID
    const categoryIdResult = CategoryId.createFromString(command.id);
    if (categoryIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_CATEGORY_ID);
    }

    const categoryId = categoryIdResult.getValue();

    // Find category
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      return Result.fail(ErrorCode.CATEGORY_NOT_FOUND);
    }

    // Check if category has courses
    const hasCourses = await this.categoryRepository.hasCourses(categoryId);
    if (hasCourses) {
      return Result.fail(ErrorCode.CATEGORY_HAS_COURSES);
    }

    // Delete
    try {
      await this.categoryRepository.delete(categoryId);
    } catch (error) {
      return Result.fail(ErrorCode.INTERNAL_ERROR);
    }

    return Result.ok(undefined);
  }
}
