import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { CreateManufacturerCommand } from './CreateManufacturerCommand.ts';
import { type ILlmManufacturerRepository } from '../../../domain/repositories/ILlmManufacturerRepository.ts';
import { LlmManufacturer } from '../../../domain/entities/LlmManufacturer.ts';
import { type LlmManufacturerDto } from '../../dtos/LlmManufacturerDto.ts';

export class CreateManufacturerHandler implements ICommandHandler<CreateManufacturerCommand, LlmManufacturerDto> {
  constructor(private manufacturerRepository: ILlmManufacturerRepository) {}

  async execute(command: CreateManufacturerCommand): Promise<Result<LlmManufacturerDto>> {
    // Check slug uniqueness
    const slugExists = await this.manufacturerRepository.existsBySlug(command.slug);
    if (slugExists) {
      return Result.fail(ErrorCode.MANUFACTURER_SLUG_ALREADY_EXISTS);
    }

    // Create entity
    const manufacturerResult = LlmManufacturer.create(command.name, command.slug);
    if (manufacturerResult.isFailure) {
      return Result.fail(manufacturerResult.getError() as string);
    }

    const manufacturer = manufacturerResult.getValue();

    // Persist
    try {
      await this.manufacturerRepository.save(manufacturer);
    } catch (error) {
      return Result.fail(ErrorCode.INTERNAL_ERROR);
    }

    // Return DTO
    const dto: LlmManufacturerDto = {
      id: manufacturer.getId().toValue(),
      name: manufacturer.getName(),
      slug: manufacturer.getSlug(),
      createdAt: manufacturer.getCreatedAt().toISOString(),
      updatedAt: manufacturer.getUpdatedAt().toISOString(),
    };

    return Result.ok(dto);
  }
}
