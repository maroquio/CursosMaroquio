import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { UpdateManufacturerCommand } from './UpdateManufacturerCommand.ts';
import { type ILlmManufacturerRepository } from '../../../domain/repositories/ILlmManufacturerRepository.ts';
import { ManufacturerId } from '../../../domain/value-objects/ManufacturerId.ts';
import { type LlmManufacturerDto } from '../../dtos/LlmManufacturerDto.ts';

export class UpdateManufacturerHandler implements ICommandHandler<UpdateManufacturerCommand, LlmManufacturerDto> {
  constructor(private manufacturerRepository: ILlmManufacturerRepository) {}

  async execute(command: UpdateManufacturerCommand): Promise<Result<LlmManufacturerDto>> {
    // Parse ID
    const idResult = ManufacturerId.createFromString(command.id);
    if (idResult.isFailure) return Result.fail(idResult.getError() as string);

    // Find manufacturer
    const manufacturer = await this.manufacturerRepository.findById(idResult.getValue());
    if (!manufacturer) {
      return Result.fail(ErrorCode.MANUFACTURER_NOT_FOUND);
    }

    // Update name if provided
    if (command.name !== undefined) {
      const nameResult = manufacturer.updateName(command.name);
      if (nameResult.isFailure) {
        return Result.fail(nameResult.getError() as string);
      }
    }

    // Update slug if provided
    if (command.slug !== undefined) {
      // Check slug uniqueness if changed
      if (command.slug !== manufacturer.getSlug()) {
        const slugExists = await this.manufacturerRepository.existsBySlug(command.slug);
        if (slugExists) {
          return Result.fail(ErrorCode.MANUFACTURER_SLUG_ALREADY_EXISTS);
        }
      }

      const slugResult = manufacturer.updateSlug(command.slug);
      if (slugResult.isFailure) {
        return Result.fail(slugResult.getError() as string);
      }
    }

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
