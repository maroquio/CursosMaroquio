import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';

/**
 * Slug value object
 * Represents a URL-friendly identifier for courses
 * Generated from course title, must be unique
 */
export class Slug {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  /**
   * Create a Slug from a validated string
   */
  public static create(value: string): Result<Slug> {
    if (!value || value.trim().length === 0) {
      return Result.fail(ErrorCode.SLUG_EMPTY);
    }

    const normalized = value.trim().toLowerCase();

    if (normalized.length < 3) {
      return Result.fail(ErrorCode.SLUG_TOO_SHORT);
    }

    if (normalized.length > 100) {
      return Result.fail(ErrorCode.SLUG_TOO_LONG);
    }

    // Slug format: lowercase letters, numbers, and hyphens
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(normalized)) {
      return Result.fail(ErrorCode.SLUG_INVALID_FORMAT);
    }

    return Result.ok(new Slug(normalized));
  }

  /**
   * Generate a slug from a title
   */
  public static fromTitle(title: string): Result<Slug> {
    if (!title || title.trim().length === 0) {
      return Result.fail(ErrorCode.SLUG_EMPTY);
    }

    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    return Slug.create(slug);
  }

  /**
   * Get the slug value
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * Check equality
   */
  public equals(other: Slug): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
