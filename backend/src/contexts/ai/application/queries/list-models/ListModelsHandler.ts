import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { ListModelsQuery } from './ListModelsQuery.ts';
import { type ILlmModelRepository } from '../../../domain/repositories/ILlmModelRepository.ts';
import { ManufacturerId } from '../../../domain/value-objects/ManufacturerId.ts';
import { type LlmModelDto } from '../../dtos/LlmModelDto.ts';

export class ListModelsHandler implements IQueryHandler<ListModelsQuery, LlmModelDto[]> {
  constructor(private modelRepository: ILlmModelRepository) {}

  async execute(query: ListModelsQuery): Promise<Result<LlmModelDto[]>> {
    try {
      let models;

      if (query.manufacturerId) {
        const idResult = ManufacturerId.createFromString(query.manufacturerId);
        if (idResult.isFailure) return Result.fail(idResult.getError() as string);

        models = await this.modelRepository.findByManufacturerId(idResult.getValue());
      } else {
        models = await this.modelRepository.findAll();
      }

      const dtos: LlmModelDto[] = models.map((model) => ({
        id: model.getId().toValue(),
        manufacturerId: model.getManufacturerId().toValue(),
        name: model.getName(),
        technicalName: model.getTechnicalName(),
        pricePerMillionInputTokens: model.getPricePerMillionInputTokens(),
        pricePerMillionOutputTokens: model.getPricePerMillionOutputTokens(),
        isDefault: model.getIsDefault(),
        createdAt: model.getCreatedAt().toISOString(),
        updatedAt: model.getUpdatedAt().toISOString(),
      }));

      return Result.ok(dtos);
    } catch (error) {
      return Result.fail(ErrorCode.INTERNAL_ERROR);
    }
  }
}
