import { Entity } from '@shared/domain/Entity.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { ManufacturerId } from '../value-objects/ManufacturerId.ts';

interface LlmManufacturerProps {
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * LlmManufacturer Entity
 * Represents a manufacturer/provider of LLM models (e.g., OpenAI, Anthropic, Google)
 */
export class LlmManufacturer extends Entity<ManufacturerId> {
  private props: LlmManufacturerProps;

  private constructor(id: ManufacturerId, props: LlmManufacturerProps) {
    super(id);
    this.props = props;
  }

  /**
   * Create a new LLM manufacturer
   */
  public static create(name: string, slug: string): Result<LlmManufacturer> {
    if (!name || name.trim().length === 0) {
      return Result.fail(ErrorCode.MANUFACTURER_NAME_EMPTY);
    }

    if (name.length > 100) {
      return Result.fail(ErrorCode.MANUFACTURER_NAME_TOO_LONG);
    }

    if (!slug || slug.trim().length === 0) {
      return Result.fail(ErrorCode.MANUFACTURER_SLUG_EMPTY);
    }

    const now = new Date();
    const id = ManufacturerId.create();

    const manufacturer = new LlmManufacturer(id, {
      name: name.trim(),
      slug: slug.trim(),
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(manufacturer);
  }

  /**
   * Reconstruct a manufacturer from persistence
   */
  public static reconstruct(
    id: ManufacturerId,
    name: string,
    slug: string,
    createdAt: Date,
    updatedAt: Date
  ): LlmManufacturer {
    return new LlmManufacturer(id, {
      name,
      slug,
      createdAt,
      updatedAt,
    });
  }

  // Getters
  public getName(): string {
    return this.props.name;
  }

  public getSlug(): string {
    return this.props.slug;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business Logic

  /**
   * Update manufacturer name
   */
  public updateName(name: string): Result<void> {
    if (!name || name.trim().length === 0) {
      return Result.fail(ErrorCode.MANUFACTURER_NAME_EMPTY);
    }

    if (name.length > 100) {
      return Result.fail(ErrorCode.MANUFACTURER_NAME_TOO_LONG);
    }

    this.props.name = name.trim();
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Update manufacturer slug
   */
  public updateSlug(slug: string): Result<void> {
    if (!slug || slug.trim().length === 0) {
      return Result.fail(ErrorCode.MANUFACTURER_SLUG_EMPTY);
    }

    this.props.slug = slug.trim();
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }
}
