import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { LlmManufacturer } from '../../../../domain/entities/LlmManufacturer.ts';
import { ManufacturerId } from '../../../../domain/value-objects/ManufacturerId.ts';
import { type LlmManufacturerSchema } from '../schema.ts';

/**
 * LlmManufacturerMapper
 * Converts between LlmManufacturer entity and database schema
 */
export class LlmManufacturerMapper {
  /**
   * Convert LlmManufacturer entity to database row
   */
  public static toPersistence(manufacturer: LlmManufacturer) {
    return {
      id: manufacturer.getId().toValue(),
      name: manufacturer.getName(),
      slug: manufacturer.getSlug(),
      createdAt: manufacturer.getCreatedAt(),
      updatedAt: manufacturer.getUpdatedAt(),
    };
  }

  /**
   * Convert database row to LlmManufacturer entity
   */
  public static toDomain(raw: LlmManufacturerSchema): Result<LlmManufacturer> {
    const manufacturerIdResult = ManufacturerId.createFromString(raw.id);
    if (manufacturerIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_MANUFACTURER_ID);
    }

    const manufacturer = LlmManufacturer.reconstruct(
      manufacturerIdResult.getValue(),
      raw.name,
      raw.slug,
      raw.createdAt,
      raw.updatedAt
    );

    return Result.ok(manufacturer);
  }
}
