import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { SetDefaultModelCommand } from './SetDefaultModelCommand.ts';
import { type ILlmModelRepository } from '../../../domain/repositories/ILlmModelRepository.ts';
import { LlmModelId } from '../../../domain/value-objects/LlmModelId.ts';
import { type LlmModelDto } from '../../dtos/LlmModelDto.ts';

export class SetDefaultModelHandler implements ICommandHandler<SetDefaultModelCommand, LlmModelDto> {
  constructor(private modelRepository: ILlmModelRepository) {}

  async execute(command: SetDefaultModelCommand): Promise<Result<LlmModelDto>> {
    // Parse ID
    const idResult = LlmModelId.createFromString(command.id);
    if (idResult.isFailure) return Result.fail(idResult.getError() as string);

    // Find model
    const model = await this.modelRepository.findById(idResult.getValue());
    if (!model) {
      return Result.fail(ErrorCode.LLM_MODEL_NOT_FOUND);
    }

    // Clear existing default and set new one
    await this.modelRepository.clearDefault();
    model.setDefault(true);

    // Persist
    try {
      await this.modelRepository.save(model);
    } catch (error) {
      return Result.fail(ErrorCode.INTERNAL_ERROR);
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
