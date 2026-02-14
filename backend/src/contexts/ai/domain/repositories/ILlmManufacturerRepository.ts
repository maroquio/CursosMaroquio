import { type IRepository } from '@shared/infrastructure/persistence/IRepository.ts';
import { LlmManufacturer } from '../entities/LlmManufacturer.ts';
import { ManufacturerId } from '../value-objects/ManufacturerId.ts';

export interface ILlmManufacturerRepository extends IRepository<LlmManufacturer, ManufacturerId> {
  findBySlug(slug: string): Promise<LlmManufacturer | null>;
  existsBySlug(slug: string): Promise<boolean>;
  findAll(): Promise<LlmManufacturer[]>;
}
