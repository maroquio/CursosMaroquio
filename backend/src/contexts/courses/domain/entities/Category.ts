import { Entity } from '@shared/domain/Entity.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { CategoryId } from '../value-objects/CategoryId.ts';
import { Slug } from '../value-objects/Slug.ts';

interface CategoryProps {
  name: string;
  slug: Slug;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Category Entity
 * Represents a course category for organization
 */
export class Category extends Entity<CategoryId> {
  private props: CategoryProps;

  private constructor(id: CategoryId, props: CategoryProps) {
    super(id);
    this.props = props;
  }

  /**
   * Create a new category
   */
  public static create(
    name: string,
    slug: Slug,
    description?: string | null
  ): Result<Category> {
    // Validate name
    if (!name || name.trim().length === 0) {
      return Result.fail(ErrorCode.CATEGORY_NAME_EMPTY);
    }

    if (name.length > 100) {
      return Result.fail(ErrorCode.CATEGORY_NAME_TOO_LONG);
    }

    const now = new Date();
    const categoryId = CategoryId.create();

    const category = new Category(categoryId, {
      name: name.trim(),
      slug,
      description: description?.trim() ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(category);
  }

  /**
   * Reconstruct a category from persistence
   */
  public static reconstruct(
    id: CategoryId,
    name: string,
    slug: Slug,
    description: string | null,
    createdAt: Date,
    updatedAt: Date
  ): Category {
    return new Category(id, {
      name,
      slug,
      description,
      createdAt,
      updatedAt,
    });
  }

  // Getters
  public getName(): string {
    return this.props.name;
  }

  public getSlug(): Slug {
    return this.props.slug;
  }

  public getDescription(): string | null {
    return this.props.description;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business Logic

  /**
   * Update category name
   */
  public updateName(name: string): Result<void> {
    if (!name || name.trim().length === 0) {
      return Result.fail(ErrorCode.CATEGORY_NAME_EMPTY);
    }

    if (name.length > 100) {
      return Result.fail(ErrorCode.CATEGORY_NAME_TOO_LONG);
    }

    this.props.name = name.trim();
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Update category slug
   */
  public updateSlug(slug: Slug): void {
    this.props.slug = slug;
    this.props.updatedAt = new Date();
  }

  /**
   * Update category description
   */
  public updateDescription(description: string | null): void {
    this.props.description = description?.trim() ?? null;
    this.props.updatedAt = new Date();
  }
}
