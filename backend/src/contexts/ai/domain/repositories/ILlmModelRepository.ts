import { type IRepository } from '@shared/infrastructure/persistence/IRepository.ts';
import { LlmModel } from '../entities/LlmModel.ts';
import { LlmModelId } from '../value-objects/LlmModelId.ts';
import { ManufacturerId } from '../value-objects/ManufacturerId.ts';

export interface ILlmModelRepository extends IRepository<LlmModel, LlmModelId> {
  findByManufacturerId(manufacturerId: ManufacturerId): Promise<LlmModel[]>;
  findByTechnicalName(technicalName: string): Promise<LlmModel | null>;
  existsByTechnicalName(technicalName: string): Promise<boolean>;
  findDefault(): Promise<LlmModel | null>;
  findAll(): Promise<LlmModel[]>;
  clearDefault(): Promise<void>;
}
