import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { CreateCategoryCommand } from './CreateCategoryCommand.ts';
import { type ICategoryRepository } from '../../../domain/repositories/ICategoryRepository.ts';
import { Category } from '../../../domain/entities/Category.ts';
import { Slug } from '../../../domain/value-objects/Slug.ts';
import { type CategoryDto } from '../../dtos/CategoryDto.ts';

/**
 * CreateCategoryHandler
 * Handles creating a new category
 */
export class CreateCategoryHandler implements ICommandHandler<CreateCategoryCommand, CategoryDto> {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(command: CreateCategoryCommand): Promise<Result<CategoryDto>> {
    // Generate slug from name
    const slugResult = Slug.fromTitle(command.name);
    if (slugResult.isFailure) {
      return Result.fail(slugResult.getError() as string);
    }

    const slug = slugResult.getValue();

    // Check if slug already exists
    const slugExists = await this.categoryRepository.existsBySlug(slug);
    if (slugExists) {
      return Result.fail(ErrorCode.CATEGORY_SLUG_ALREADY_EXISTS);
    }

    // Create category
    const categoryResult = Category.create(
      command.name,
      slug,
      command.description
    );

    if (categoryResult.isFailure) {
      return Result.fail(categoryResult.getError() as string);
    }

    const category = categoryResult.getValue();

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
