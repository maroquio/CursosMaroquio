import { type IRepository } from '@shared/infrastructure/persistence/IRepository.ts';
import { Category } from '../entities/Category.ts';
import { CategoryId } from '../value-objects/CategoryId.ts';
import { Slug } from '../value-objects/Slug.ts';

/**
 * Category Repository Interface
 * Defines the contract for category persistence operations
 */
export interface ICategoryRepository extends IRepository<Category, CategoryId> {
  /**
   * Find a category by its slug
   */
  findBySlug(slug: Slug): Promise<Category | null>;

  /**
   * Check if a category with the given slug exists
   */
  existsBySlug(slug: Slug): Promise<boolean>;

  /**
   * Find all categories ordered by name
   */
  findAll(): Promise<Category[]>;

  /**
   * Check if a category has courses assigned to it
   */
  hasCourses(id: CategoryId): Promise<boolean>;
}
