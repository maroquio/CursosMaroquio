import { eq, asc } from 'drizzle-orm';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import { type ILlmModelRepository } from '../../../domain/repositories/ILlmModelRepository.ts';
import { LlmModel } from '../../../domain/entities/LlmModel.ts';
import { LlmModelId } from '../../../domain/value-objects/LlmModelId.ts';
import { ManufacturerId } from '../../../domain/value-objects/ManufacturerId.ts';
import { llmModelsTable } from './schema.ts';
import { LlmModelMapper } from './mappers/LlmModelMapper.ts';

/**
 * DrizzleLlmModelRepository
 * Implements ILlmModelRepository using Drizzle ORM with PostgreSQL
 */
export class DrizzleLlmModelRepository implements ILlmModelRepository {
  constructor(private dbProvider: IDatabaseProvider) {}

  private get db(): DrizzleDatabase {
    return this.dbProvider.getDb();
  }

  async save(model: LlmModel): Promise<void> {
    const data = LlmModelMapper.toPersistence(model);

    // Check if model already exists
    const existing = await this.db
      .select()
      .from(llmModelsTable)
      .where(eq(llmModelsTable.id, model.getId().toValue()));

    if (existing && existing.length > 0) {
      // Update existing model
      await this.db
        .update(llmModelsTable)
        .set(data)
        .where(eq(llmModelsTable.id, model.getId().toValue()));
    } else {
      // Insert new model
      await this.db.insert(llmModelsTable).values(data);
    }
  }

  async findById(id: LlmModelId): Promise<LlmModel | null> {
    const result = await this.db
      .select()
      .from(llmModelsTable)
      .where(eq(llmModelsTable.id, id.toValue()));

    if (!result || result.length === 0) {
      return null;
    }

    const modelResult = LlmModelMapper.toDomain(result[0]!);
    return modelResult.isOk ? modelResult.getValue() : null;
  }

  async exists(id: LlmModelId): Promise<boolean> {
    const result = await this.db
      .select({ id: llmModelsTable.id })
      .from(llmModelsTable)
      .where(eq(llmModelsTable.id, id.toValue()));

    return result && result.length > 0;
  }

  async delete(id: LlmModelId): Promise<void> {
    await this.db
      .delete(llmModelsTable)
      .where(eq(llmModelsTable.id, id.toValue()));
  }

  async findByManufacturerId(manufacturerId: ManufacturerId): Promise<LlmModel[]> {
    const result = await this.db
      .select()
      .from(llmModelsTable)
      .where(eq(llmModelsTable.manufacturerId, manufacturerId.toValue()))
      .orderBy(asc(llmModelsTable.name));

    const models: LlmModel[] = [];
    for (const row of result) {
      const modelResult = LlmModelMapper.toDomain(row);
      if (modelResult.isOk) {
        models.push(modelResult.getValue());
      }
    }

    return models;
  }

  async findByTechnicalName(technicalName: string): Promise<LlmModel | null> {
    const result = await this.db
      .select()
      .from(llmModelsTable)
      .where(eq(llmModelsTable.technicalName, technicalName));

    if (!result || result.length === 0) {
      return null;
    }

    const modelResult = LlmModelMapper.toDomain(result[0]!);
    return modelResult.isOk ? modelResult.getValue() : null;
  }

  async existsByTechnicalName(technicalName: string): Promise<boolean> {
    const result = await this.db
      .select({ id: llmModelsTable.id })
      .from(llmModelsTable)
      .where(eq(llmModelsTable.technicalName, technicalName));

    return result && result.length > 0;
  }

  async findDefault(): Promise<LlmModel | null> {
    const result = await this.db
      .select()
      .from(llmModelsTable)
      .where(eq(llmModelsTable.isDefault, true));

    if (!result || result.length === 0) {
      return null;
    }

    const modelResult = LlmModelMapper.toDomain(result[0]!);
    return modelResult.isOk ? modelResult.getValue() : null;
  }

  async findAll(): Promise<LlmModel[]> {
    const result = await this.db
      .select()
      .from(llmModelsTable)
      .orderBy(asc(llmModelsTable.name));

    const models: LlmModel[] = [];
    for (const row of result) {
      const modelResult = LlmModelMapper.toDomain(row);
      if (modelResult.isOk) {
        models.push(modelResult.getValue());
      }
    }

    return models;
  }

  async clearDefault(): Promise<void> {
    await this.db
      .update(llmModelsTable)
      .set({ isDefault: false })
      .where(eq(llmModelsTable.isDefault, true));
  }
}
