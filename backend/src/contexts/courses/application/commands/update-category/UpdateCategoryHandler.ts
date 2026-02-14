import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { UpdateCategoryCommand } from './UpdateCategoryCommand.ts';
import { type ICategoryRepository } from '../../../domain/repositories/ICategoryRepository.ts';
import { CategoryId } from '../../../domain/value-objects/CategoryId.ts';
import { Slug } from '../../../domain/value-objects/Slug.ts';
import { type CategoryDto } from '../../dtos/CategoryDto.ts';

/**
 * UpdateCategoryHandler
 * Handles updating an existing category
 */
export class UpdateCategoryHandler implements ICommandHandler<UpdateCategoryCommand, CategoryDto> {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(command: UpdateCategoryCommand): Promise<Result<CategoryDto>> {
    // Validate category ID
    const categoryIdResult = CategoryId.createFromString(command.id);
    if (categoryIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_CATEGORY_ID);
    }

    // Find category
    const category = await this.categoryRepository.findById(categoryIdResult.getValue());
    if (!category) {
      return Result.fail(ErrorCode.CATEGORY_NOT_FOUND);
    }

    // Update name if provided
    if (command.name && command.name !== category.getName()) {
      const updateNameResult = category.updateName(command.name);
      if (updateNameResult.isFailure) {
        return Result.fail(updateNameResult.getError() as string);
      }

      // Generate new slug from name
      const slugResult = Slug.fromTitle(command.name);
      if (slugResult.isFailure) {
        return Result.fail(slugResult.getError() as string);
      }

      const newSlug = slugResult.getValue();

      // Check if new slug already exists (and belongs to a different category)
      if (!newSlug.equals(category.getSlug())) {
        const slugExists = await this.categoryRepository.existsBySlug(newSlug);
        if (slugExists) {
          return Result.fail(ErrorCode.CATEGORY_SLUG_ALREADY_EXISTS);
        }
        category.updateSlug(newSlug);
      }
    }

    // Update description
    if (command.description !== undefined) {
      category.updateDescription(command.description);
    }

    // Persist
    try {
      await this.categoryRepository.save(category);
    } catch (error) {
      return Result.fail(ErrorCode.INTERNAL_ERROR);
    }

    // Return DTO
    const dto: CategoryDto = {
      id: category.getId().toValue(),
      name: category.getName(),
      slug: category.getSlug().getValue(),
      description: category.getDescription(),
      createdAt: category.getCreatedAt().toISOString(),
      updatedAt: category.getUpdatedAt().toISOString(),
    };

    return Result.ok(dto);
  }
}
