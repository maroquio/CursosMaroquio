import { type ICommandHandler } from '@shared/application/ICommandHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { DeleteModelCommand } from './DeleteModelCommand.ts';
import { type ILlmModelRepository } from '../../../domain/repositories/ILlmModelRepository.ts';
import { LlmModelId } from '../../../domain/value-objects/LlmModelId.ts';

export class DeleteModelHandler implements ICommandHandler<DeleteModelCommand, void> {
  constructor(private modelRepository: ILlmModelRepository) {}

  async execute(command: DeleteModelCommand): Promise<Result<void>> {
    // Parse ID
    const idResult = LlmModelId.createFromString(command.id);
    if (idResult.isFailure) return Result.fail(idResult.getError() as string);

    const id = idResult.getValue();

    // Find model
    const model = await this.modelRepository.findById(id);
    if (!model) {
      return Result.fail(ErrorCode.LLM_MODEL_NOT_FOUND);
    }

    // Delete
    try {
      await this.modelRepository.delete(id);
    } catch (error) {
      return Result.fail(ErrorCode.INTERNAL_ERROR);
    }

    return Result.ok(undefined);
  }
}
