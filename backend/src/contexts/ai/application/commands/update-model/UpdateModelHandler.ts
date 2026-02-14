import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { UpdateModelCommand } from './UpdateModelCommand.ts';
import { type ILlmModelRepository } from '../../../domain/repositories/ILlmModelRepository.ts';
import { LlmModelId } from '../../../domain/value-objects/LlmModelId.ts';
import { type LlmModelDto } from '../../dtos/LlmModelDto.ts';

export class UpdateModelHandler implements ICommandHandler<UpdateModelCommand, LlmModelDto> {
  constructor(private modelRepository: ILlmModelRepository) {}

  async execute(command: UpdateModelCommand): Promise<Result<LlmModelDto>> {
    // Parse ID
    const idResult = LlmModelId.createFromString(command.id);
    if (idResult.isFailure) return Result.fail(idResult.getError() as string);

    // Find model
    const model = await this.modelRepository.findById(idResult.getValue());
    if (!model) {
      return Result.fail(ErrorCode.LLM_MODEL_NOT_FOUND);
    }

    // Update name if provided
    if (command.name !== undefined) {
      const nameResult = model.updateName(command.name);
      if (nameResult.isFailure) {
        return Result.fail(nameResult.getError() as string);
      }
    }

    // Update technicalName if provided
    if (command.technicalName !== undefined) {
      // Check uniqueness if changed
      if (command.technicalName !== model.getTechnicalName()) {
        const exists = await this.modelRepository.existsByTechnicalName(command.technicalName);
        if (exists) {
          return Result.fail(ErrorCode.LLM_MODEL_TECHNICAL_NAME_ALREADY_EXISTS);
        }
      }

      const techResult = model.updateTechnicalName(command.technicalName);
      if (techResult.isFailure) {
        return Result.fail(techResult.getError() as string);
      }
    }

    // Update prices if provided
    if (command.pricePerMillionInputTokens !== undefined || command.pricePerMillionOutputTokens !== undefined) {
      model.updatePrices(
        command.pricePerMillionInputTokens ?? model.getPricePerMillionInputTokens(),
        command.pricePerMillionOutputTokens ?? model.getPricePerMillionOutputTokens()
      );
    }

    // Update isDefault if provided
    if (command.isDefault !== undefined && command.isDefault && !model.getIsDefault()) {
      await this.modelRepository.clearDefault();
      model.setDefault(true);
    } else if (command.isDefault === false) {
      model.setDefault(false);
    }

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
