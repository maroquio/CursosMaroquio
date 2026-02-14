import { eq, asc } from 'drizzle-orm';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import { type ICategoryRepository } from '../../../domain/repositories/ICategoryRepository.ts';
import { Category } from '../../../domain/entities/Category.ts';
import { CategoryId } from '../../../domain/value-objects/CategoryId.ts';
import { Slug } from '../../../domain/value-objects/Slug.ts';
import { categoriesTable } from './schema.ts';
import { CategoryMapper } from './mappers/CategoryMapper.ts';

/**
 * DrizzleCategoryRepository
 * Implements ICategoryRepository using Drizzle ORM with PostgreSQL
 */
export class DrizzleCategoryRepository implements ICategoryRepository {
  constructor(private dbProvider: IDatabaseProvider) {}

  private get db(): DrizzleDatabase {
    return this.dbProvider.getDb();
  }

  async save(category: Category): Promise<void> {
    const data = CategoryMapper.toPersistence(category);

    // Check if category already exists
    const existing = await this.db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, category.getId().toValue()));

    if (existing && existing.length > 0) {
      // Update existing category
      await this.db
        .update(categoriesTable)
        .set(data)
        .where(eq(categoriesTable.id, category.getId().toValue()));
    } else {
      // Insert new category
      await this.db.insert(categoriesTable).values(data);
    }
  }

  async findById(id: CategoryId): Promise<Category | null> {
    const result = await this.db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, id.toValue()));

    if (!result || result.length === 0) {
      return null;
    }

    const categoryResult = CategoryMapper.toDomain(result[0]!);
    return categoryResult.isOk ? categoryResult.getValue() : null;
  }

  async exists(id: CategoryId): Promise<boolean> {
    const result = await this.db
      .select({ id: categoriesTable.id })
      .from(categoriesTable)
      .where(eq(categoriesTable.id, id.toValue()));

    return result && result.length > 0;
  }

  async delete(id: CategoryId): Promise<void> {
    await this.db
      .delete(categoriesTable)
      .where(eq(categoriesTable.id, id.toValue()));
  }

  async findBySlug(slug: Slug): Promise<Category | null> {
    const result = await this.db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.slug, slug.getValue()));

    if (!result || result.length === 0) {
      return null;
    }

    const categoryResult = CategoryMapper.toDomain(result[0]!);
    return categoryResult.isOk ? categoryResult.getValue() : null;
  }

  async existsBySlug(slug: Slug): Promise<boolean> {
    const result = await this.db
      .select({ id: categoriesTable.id })
      .from(categoriesTable)
      .where(eq(categoriesTable.slug, slug.getValue()));

    return result && result.length > 0;
  }

  async findAll(): Promise<Category[]> {
    const result = await this.db
      .select()
      .from(categoriesTable)
      .orderBy(asc(categoriesTable.name));

    const categories: Category[] = [];
    for (const row of result) {
      const categoryResult = CategoryMapper.toDomain(row);
      if (categoryResult.isOk) {
        categories.push(categoryResult.getValue());
      }
    }

    return categories;
  }

  async hasCourses(_id: CategoryId): Promise<boolean> {
    // TODO: Implement when courses have a categoryId field
    // For now, return false to allow category deletion
    return false;
  }
}
