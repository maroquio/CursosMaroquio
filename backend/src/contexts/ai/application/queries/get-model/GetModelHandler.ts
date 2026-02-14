import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { GetModelQuery } from './GetModelQuery.ts';
import { type ILlmModelRepository } from '../../../domain/repositories/ILlmModelRepository.ts';
import { LlmModelId } from '../../../domain/value-objects/LlmModelId.ts';
import { type LlmModelDto } from '../../dtos/LlmModelDto.ts';

export class GetModelHandler implements IQueryHandler<GetModelQuery, LlmModelDto> {
  constructor(private modelRepository: ILlmModelRepository) {}

  async execute(query: GetModelQuery): Promise<Result<LlmModelDto>> {
    // Parse ID
    const idResult = LlmModelId.createFromString(query.id);
    if (idResult.isFailure) return Result.fail(idResult.getError() as string);

    // Find model
    const model = await this.modelRepository.findById(idResult.getValue());
    if (!model) {
      return Result.fail(ErrorCode.LLM_MODEL_NOT_FOUND);
    }

    // Return DTO
    const dto: LlmModelDto = {
      id: model.getId().toValue(),
      manufacturerId: model.getManufacturerId().toValue(),
      name: model.getName(),
      technicalName: model.getTechnicalName(),
      pricePerMillionInputTokens: model.getPricePerMillionInputTokens(),
      pricePerMillionOutputTokens: model.getPricePerMillionOutputTokens(),
      isDefault: model.getIsDefault(),
      createdAt: model.getCreatedAt().toISOString(),
      updatedAt: model.getUpdatedAt().toISOString(),
    };

    return Result.ok(dto);
  }
}
