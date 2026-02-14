import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { GetDefaultModelQuery } from './GetDefaultModelQuery.ts';
import { type ILlmModelRepository } from '../../../domain/repositories/ILlmModelRepository.ts';
import { type LlmModelDto } from '../../dtos/LlmModelDto.ts';

export class GetDefaultModelHandler implements IQueryHandler<GetDefaultModelQuery, LlmModelDto> {
  constructor(private modelRepository: ILlmModelRepository) {}

  async execute(_query: GetDefaultModelQuery): Promise<Result<LlmModelDto>> {
    const model = await this.modelRepository.findDefault();
    if (!model) {
      return Result.fail(ErrorCode.NO_DEFAULT_LLM_MODEL);
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
