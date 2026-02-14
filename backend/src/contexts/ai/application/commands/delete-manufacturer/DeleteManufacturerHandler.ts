import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { DeleteManufacturerCommand } from './DeleteManufacturerCommand.ts';
import { type ILlmManufacturerRepository } from '../../../domain/repositories/ILlmManufacturerRepository.ts';
import { type ILlmModelRepository } from '../../../domain/repositories/ILlmModelRepository.ts';
import { ManufacturerId } from '../../../domain/value-objects/ManufacturerId.ts';

export class DeleteManufacturerHandler implements ICommandHandler<DeleteManufacturerCommand, void> {
  constructor(
    private manufacturerRepository: ILlmManufacturerRepository,
    private modelRepository: ILlmModelRepository
  ) {}

  async execute(command: DeleteManufacturerCommand): Promise<Result<void>> {
    // Parse ID
    const idResult = ManufacturerId.createFromString(command.id);
    if (idResult.isFailure) return Result.fail(idResult.getError() as string);

    const id = idResult.getValue();

    // Find manufacturer
    const manufacturer = await this.manufacturerRepository.findById(id);
    if (!manufacturer) {
      return Result.fail(ErrorCode.MANUFACTURER_NOT_FOUND);
    }

    // Check if manufacturer has models
    const models = await this.modelRepository.findByManufacturerId(id);
    if (models.length > 0) {
      return Result.fail(ErrorCode.MANUFACTURER_HAS_MODELS);
    }

    // Delete
    try {
      await this.manufacturerRepository.delete(id);
    } catch (error) {
      return Result.fail(ErrorCode.INTERNAL_ERROR);
    }

    return Result.ok(undefined);
  }
}
