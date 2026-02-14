import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { Category } from '../../../../domain/entities/Category.ts';
import { CategoryId } from '../../../../domain/value-objects/CategoryId.ts';
import { Slug } from '../../../../domain/value-objects/Slug.ts';
import { type CategorySchema } from '../schema.ts';

/**
 * CategoryMapper
 * Converts between Category entity and database schema
 */
export class CategoryMapper {
  /**
   * Convert Category entity to database row
   */
  public static toPersistence(category: Category) {
    return {
      id: category.getId().toValue(),
      name: category.getName(),
      slug: category.getSlug().getValue(),
      description: category.getDescription(),
      createdAt: category.getCreatedAt(),
      updatedAt: category.getUpdatedAt(),
    };
  }

  /**
   * Convert database row to Category entity
   */
  public static toDomain(raw: CategorySchema): Result<Category> {
    const categoryIdResult = CategoryId.createFromString(raw.id);
    if (categoryIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_CATEGORY_ID);
    }

    const slugResult = Slug.create(raw.slug);
    if (slugResult.isFailure) {
      return Result.fail(slugResult.getError() as string);
    }

    const category = Category.reconstruct(
      categoryIdResult.getValue(),
      raw.name,
      slugResult.getValue(),
      raw.description,
      raw.createdAt,
      raw.updatedAt
    );

    return Result.ok(category);
  }
}
