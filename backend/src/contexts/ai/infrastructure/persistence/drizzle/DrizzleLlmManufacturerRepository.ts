import { eq, asc } from 'drizzle-orm';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import { type ILlmManufacturerRepository } from '../../../domain/repositories/ILlmManufacturerRepository.ts';
import { LlmManufacturer } from '../../../domain/entities/LlmManufacturer.ts';
import { ManufacturerId } from '../../../domain/value-objects/ManufacturerId.ts';
import { llmManufacturersTable } from './schema.ts';
import { LlmManufacturerMapper } from './mappers/LlmManufacturerMapper.ts';

/**
 * DrizzleLlmManufacturerRepository
 * Implements ILlmManufacturerRepository using Drizzle ORM with PostgreSQL
 */
export class DrizzleLlmManufacturerRepository implements ILlmManufacturerRepository {
  constructor(private dbProvider: IDatabaseProvider) {}

  private get db(): DrizzleDatabase {
    return this.dbProvider.getDb();
  }

  async save(manufacturer: LlmManufacturer): Promise<void> {
    const data = LlmManufacturerMapper.toPersistence(manufacturer);

    // Check if manufacturer already exists
    const existing = await this.db
      .select()
      .from(llmManufacturersTable)
      .where(eq(llmManufacturersTable.id, manufacturer.getId().toValue()));

    if (existing && existing.length > 0) {
      // Update existing manufacturer
      await this.db
        .update(llmManufacturersTable)
        .set(data)
        .where(eq(llmManufacturersTable.id, manufacturer.getId().toValue()));
    } else {
      // Insert new manufacturer
      await this.db.insert(llmManufacturersTable).values(data);
    }
  }

  async findById(id: ManufacturerId): Promise<LlmManufacturer | null> {
    const result = await this.db
      .select()
      .from(llmManufacturersTable)
      .where(eq(llmManufacturersTable.id, id.toValue()));

    if (!result || result.length === 0) {
      return null;
    }

    const manufacturerResult = LlmManufacturerMapper.toDomain(result[0]!);
    return manufacturerResult.isOk ? manufacturerResult.getValue() : null;
  }

  async exists(id: ManufacturerId): Promise<boolean> {
    const result = await this.db
      .select({ id: llmManufacturersTable.id })
      .from(llmManufacturersTable)
      .where(eq(llmManufacturersTable.id, id.toValue()));

    return result && result.length > 0;
  }

  async delete(id: ManufacturerId): Promise<void> {
    await this.db
      .delete(llmManufacturersTable)
      .where(eq(llmManufacturersTable.id, id.toValue()));
  }

  async findBySlug(slug: string): Promise<LlmManufacturer | null> {
    const result = await this.db
      .select()
      .from(llmManufacturersTable)
      .where(eq(llmManufacturersTable.slug, slug));

    if (!result || result.length === 0) {
      return null;
    }

    const manufacturerResult = LlmManufacturerMapper.toDomain(result[0]!);
    return manufacturerResult.isOk ? manufacturerResult.getValue() : null;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const result = await this.db
      .select({ id: llmManufacturersTable.id })
      .from(llmManufacturersTable)
      .where(eq(llmManufacturersTable.slug, slug));

    return result && result.length > 0;
  }

  async findAll(): Promise<LlmManufacturer[]> {
    const result = await this.db
      .select()
      .from(llmManufacturersTable)
      .orderBy(asc(llmManufacturersTable.name));

    const manufacturers: LlmManufacturer[] = [];
    for (const row of result) {
      const manufacturerResult = LlmManufacturerMapper.toDomain(row);
      if (manufacturerResult.isOk) {
        manufacturers.push(manufacturerResult.getValue());
      }
    }

    return manufacturers;
  }
}
