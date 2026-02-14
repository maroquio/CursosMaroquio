import { type IQueryHandler } from '@shared/application/IQueryHandler.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { ListManufacturersQuery } from './ListManufacturersQuery.ts';
import { type ILlmManufacturerRepository } from '../../../domain/repositories/ILlmManufacturerRepository.ts';
import { type LlmManufacturerDto } from '../../dtos/LlmManufacturerDto.ts';

export class ListManufacturersHandler implements IQueryHandler<ListManufacturersQuery, LlmManufacturerDto[]> {
  constructor(private manufacturerRepository: ILlmManufacturerRepository) {}

  async execute(_query: ListManufacturersQuery): Promise<Result<LlmManufacturerDto[]>> {
    try {
      const manufacturers = await this.manufacturerRepository.findAll();

      const dtos: LlmManufacturerDto[] = manufacturers.map((manufacturer) => ({
        id: manufacturer.getId().toValue(),
        name: manufacturer.getName(),
        slug: manufacturer.getSlug(),
        createdAt: manufacturer.getCreatedAt().toISOString(),
        updatedAt: manufacturer.getUpdatedAt().toISOString(),
      }));

      return Result.ok(dtos);
    } catch (error) {
      return Result.fail(ErrorCode.INTERNAL_ERROR);
    }
  }
}
