import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { CreateModelCommand } from './CreateModelCommand.ts';
import { type ILlmModelRepository } from '../../../domain/repositories/ILlmModelRepository.ts';
import { type ILlmManufacturerRepository } from '../../../domain/repositories/ILlmManufacturerRepository.ts';
import { LlmModel } from '../../../domain/entities/LlmModel.ts';
import { ManufacturerId } from '../../../domain/value-objects/ManufacturerId.ts';
import { type LlmModelDto } from '../../dtos/LlmModelDto.ts';

export class CreateModelHandler implements ICommandHandler<CreateModelCommand, LlmModelDto> {
  constructor(
    private modelRepository: ILlmModelRepository,
    private manufacturerRepository: ILlmManufacturerRepository
  ) {}

  async execute(command: CreateModelCommand): Promise<Result<LlmModelDto>> {
    // Parse manufacturer ID
    const manufacturerIdResult = ManufacturerId.createFromString(command.manufacturerId);
    if (manufacturerIdResult.isFailure) return Result.fail(manufacturerIdResult.getError() as string);

    const manufacturerId = manufacturerIdResult.getValue();

    // Validate manufacturer exists
    const manufacturer = await this.manufacturerRepository.findById(manufacturerId);
    if (!manufacturer) {
      return Result.fail(ErrorCode.MANUFACTURER_NOT_FOUND);
    }

    // Check technicalName uniqueness
    const technicalNameExists = await this.modelRepository.existsByTechnicalName(command.technicalName);
    if (technicalNameExists) {
      return Result.fail(ErrorCode.LLM_MODEL_TECHNICAL_NAME_ALREADY_EXISTS);
    }

    // If isDefault=true, clear existing default
    if (command.isDefault) {
      await this.modelRepository.clearDefault();
    }

    // Create entity
    const modelResult = LlmModel.create(
      manufacturerId,
      command.name,
      command.technicalName,
      command.pricePerMillionInputTokens ?? 0,
      command.pricePerMillionOutputTokens ?? 0,
      command.isDefault ?? false
    );

    if (modelResult.isFailure) {
      return Result.fail(modelResult.getError() as string);
    }

    const model = modelResult.getValue();

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
