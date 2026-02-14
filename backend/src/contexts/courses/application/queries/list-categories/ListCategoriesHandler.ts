import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ListCategoriesQuery } from './ListCategoriesQuery.ts';
import { type ICategoryRepository } from '../../../domain/repositories/ICategoryRepository.ts';
import { type CategoryDto } from '../../dtos/CategoryDto.ts';

/**
 * ListCategoriesHandler
 * Handles listing all categories
 */
export class ListCategoriesHandler implements IQueryHandler<ListCategoriesQuery, CategoryDto[]> {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(_query: ListCategoriesQuery): Promise<Result<CategoryDto[]>> {
    const categories = await this.categoryRepository.findAll();

    const dtos: CategoryDto[] = categories.map((category) => ({
      id: category.getId().toValue(),
      name: category.getName(),
      slug: category.getSlug().getValue(),
      description: category.getDescription(),
      createdAt: category.getCreatedAt().toISOString(),
      updatedAt: category.getUpdatedAt().toISOString(),
    }));

    return Result.ok(dtos);
  }
}
