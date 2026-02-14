import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { GetManufacturerQuery } from './GetManufacturerQuery.ts';
import { type ILlmManufacturerRepository } from '../../../domain/repositories/ILlmManufacturerRepository.ts';
import { ManufacturerId } from '../../../domain/value-objects/ManufacturerId.ts';
import { type LlmManufacturerDto } from '../../dtos/LlmManufacturerDto.ts';

export class GetManufacturerHandler implements IQueryHandler<GetManufacturerQuery, LlmManufacturerDto> {
  constructor(private manufacturerRepository: ILlmManufacturerRepository) {}

  async execute(query: GetManufacturerQuery): Promise<Result<LlmManufacturerDto>> {
    // Parse ID
    const idResult = ManufacturerId.createFromString(query.id);
    if (idResult.isFailure) return Result.fail(idResult.getError() as string);

    // Find manufacturer
    const manufacturer = await this.manufacturerRepository.findById(idResult.getValue());
    if (!manufacturer) {
      return Result.fail(ErrorCode.MANUFACTURER_NOT_FOUND);
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
