import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { LlmModel } from '../../../../domain/entities/LlmModel.ts';
import { LlmModelId } from '../../../../domain/value-objects/LlmModelId.ts';
import { ManufacturerId } from '../../../../domain/value-objects/ManufacturerId.ts';
import { type LlmModelSchema } from '../schema.ts';

/**
 * LlmModelMapper
 * Converts between LlmModel entity and database schema
 */
export class LlmModelMapper {
  /**
   * Convert LlmModel entity to database row
   */
  public static toPersistence(model: LlmModel) {
    return {
      id: model.getId().toValue(),
      manufacturerId: model.getManufacturerId().toValue(),
      name: model.getName(),
      technicalName: model.getTechnicalName(),
      pricePerMillionInputTokens: model.getPricePerMillionInputTokens(),
      pricePerMillionOutputTokens: model.getPricePerMillionOutputTokens(),
      isDefault: model.getIsDefault(),
      createdAt: model.getCreatedAt(),
      updatedAt: model.getUpdatedAt(),
    };
  }

  /**
   * Convert database row to LlmModel entity
   */
  public static toDomain(raw: LlmModelSchema): Result<LlmModel> {
    const modelIdResult = LlmModelId.createFromString(raw.id);
    if (modelIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_LLM_MODEL_ID);
    }

    const manufacturerIdResult = ManufacturerId.createFromString(raw.manufacturerId);
    if (manufacturerIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_MANUFACTURER_ID);
    }

    const model = LlmModel.reconstruct(
      modelIdResult.getValue(),
      manufacturerIdResult.getValue(),
      raw.name,
      raw.technicalName,
      raw.pricePerMillionInputTokens,
      raw.pricePerMillionOutputTokens,
      raw.isDefault,
      raw.createdAt,
      raw.updatedAt
    );

    return Result.ok(model);
  }
}
