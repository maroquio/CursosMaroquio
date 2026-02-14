import { eq, and, desc, sql } from 'drizzle-orm';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import { type ISectionBundleRepository } from '../../../domain/repositories/ISectionBundleRepository.ts';
import { SectionBundle } from '../../../domain/entities/SectionBundle.ts';
import { SectionBundleId } from '../../../domain/value-objects/SectionBundleId.ts';
import { SectionId } from '../../../domain/value-objects/SectionId.ts';
import { sectionBundlesTable } from './schema.ts';
import { SectionBundleMapper } from './SectionBundleMapper.ts';

/**
 * DrizzleSectionBundleRepository
 * Implements ISectionBundleRepository using Drizzle ORM with PostgreSQL
 */
export class DrizzleSectionBundleRepository implements ISectionBundleRepository {
  constructor(private dbProvider: IDatabaseProvider) {}

  private get db(): DrizzleDatabase {
    return this.dbProvider.getDb();
  }

  async save(bundle: SectionBundle): Promise<void> {
    const data = SectionBundleMapper.toPersistence(bundle);

    // Check if bundle already exists
    const existing = await this.db
      .select()
      .from(sectionBundlesTable)
      .where(eq(sectionBundlesTable.id, bundle.getId().toValue()));

    if (existing && existing.length > 0) {
      // Update existing bundle
      await this.db
        .update(sectionBundlesTable)
        .set(data)
        .where(eq(sectionBundlesTable.id, bundle.getId().toValue()));
    } else {
      // Insert new bundle
      await this.db.insert(sectionBundlesTable).values(data);
    }
  }

  async findById(id: SectionBundleId): Promise<SectionBundle | null> {
    const result = await this.db
      .select()
      .from(sectionBundlesTable)
      .where(eq(sectionBundlesTable.id, id.toValue()));

    if (!result || result.length === 0) {
      return null;
    }

    const bundleResult = SectionBundleMapper.toDomain(result[0]!);
    return bundleResult.isOk ? bundleResult.getValue() : null;
  }

  async exists(id: SectionBundleId): Promise<boolean> {
    const result = await this.db
      .select({ id: sectionBundlesTable.id })
      .from(sectionBundlesTable)
      .where(eq(sectionBundlesTable.id, id.toValue()));

    return result && result.length > 0;
  }

  async delete(id: SectionBundleId): Promise<void> {
    await this.db
      .delete(sectionBundlesTable)
      .where(eq(sectionBundlesTable.id, id.toValue()));
  }

  async findBySectionId(sectionId: SectionId): Promise<SectionBundle[]> {
    const result = await this.db
      .select()
      .from(sectionBundlesTable)
      .where(eq(sectionBundlesTable.sectionId, sectionId.toValue()))
      .orderBy(desc(sectionBundlesTable.version));

    const bundles: SectionBundle[] = [];
    for (const row of result) {
      const bundleResult = SectionBundleMapper.toDomain(row);
      if (bundleResult.isOk) {
        bundles.push(bundleResult.getValue());
      }
    }

    return bundles;
  }

  async findActiveBySectionId(sectionId: SectionId): Promise<SectionBundle | null> {
    const result = await this.db
      .select()
      .from(sectionBundlesTable)
      .where(
        and(
          eq(sectionBundlesTable.sectionId, sectionId.toValue()),
          eq(sectionBundlesTable.isActive, true)
        )
      );

    if (!result || result.length === 0) {
      return null;
    }

    const bundleResult = SectionBundleMapper.toDomain(result[0]!);
    return bundleResult.isOk ? bundleResult.getValue() : null;
  }

  async getNextVersion(sectionId: SectionId): Promise<number> {
    const result = await this.db
      .select({ maxVersion: sql<number>`COALESCE(MAX(${sectionBundlesTable.version}), 0)` })
      .from(sectionBundlesTable)
      .where(eq(sectionBundlesTable.sectionId, sectionId.toValue()));

    const maxVersion = result[0]?.maxVersion ?? 0;
    return maxVersion + 1;
  }

  async deactivateAllForSection(sectionId: SectionId): Promise<void> {
    await this.db
      .update(sectionBundlesTable)
      .set({ isActive: false })
      .where(eq(sectionBundlesTable.sectionId, sectionId.toValue()));
  }
}
