import { eq, and, desc, sql } from 'drizzle-orm';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import { type ILessonBundleRepository } from '../../../domain/repositories/ILessonBundleRepository.ts';
import { LessonBundle } from '../../../domain/entities/LessonBundle.ts';
import { LessonBundleId } from '../../../domain/value-objects/LessonBundleId.ts';
import { LessonId } from '../../../domain/value-objects/LessonId.ts';
import { lessonBundlesTable } from './schema.ts';
import { LessonBundleMapper } from './LessonBundleMapper.ts';

/**
 * DrizzleLessonBundleRepository
 * Implements ILessonBundleRepository using Drizzle ORM with PostgreSQL
 */
export class DrizzleLessonBundleRepository implements ILessonBundleRepository {
  constructor(private dbProvider: IDatabaseProvider) {}

  private get db(): DrizzleDatabase {
    return this.dbProvider.getDb();
  }

  async save(bundle: LessonBundle): Promise<void> {
    const data = LessonBundleMapper.toPersistence(bundle);

    // Check if bundle already exists
    const existing = await this.db
      .select()
      .from(lessonBundlesTable)
      .where(eq(lessonBundlesTable.id, bundle.getId().toValue()));

    if (existing && existing.length > 0) {
      // Update existing bundle
      await this.db
        .update(lessonBundlesTable)
        .set(data)
        .where(eq(lessonBundlesTable.id, bundle.getId().toValue()));
    } else {
      // Insert new bundle
      await this.db.insert(lessonBundlesTable).values(data);
    }
  }

  async findById(id: LessonBundleId): Promise<LessonBundle | null> {
    const result = await this.db
      .select()
      .from(lessonBundlesTable)
      .where(eq(lessonBundlesTable.id, id.toValue()));

    if (!result || result.length === 0) {
      return null;
    }

    const bundleResult = LessonBundleMapper.toDomain(result[0]!);
    return bundleResult.isOk ? bundleResult.getValue() : null;
  }

  async exists(id: LessonBundleId): Promise<boolean> {
    const result = await this.db
      .select({ id: lessonBundlesTable.id })
      .from(lessonBundlesTable)
      .where(eq(lessonBundlesTable.id, id.toValue()));

    return result && result.length > 0;
  }

  async delete(id: LessonBundleId): Promise<void> {
    await this.db
      .delete(lessonBundlesTable)
      .where(eq(lessonBundlesTable.id, id.toValue()));
  }

  async findByLessonId(lessonId: LessonId): Promise<LessonBundle[]> {
    const result = await this.db
      .select()
      .from(lessonBundlesTable)
      .where(eq(lessonBundlesTable.lessonId, lessonId.toValue()))
      .orderBy(desc(lessonBundlesTable.version));

    const bundles: LessonBundle[] = [];
    for (const row of result) {
      const bundleResult = LessonBundleMapper.toDomain(row);
      if (bundleResult.isOk) {
        bundles.push(bundleResult.getValue());
      }
    }

    return bundles;
  }

  async findActiveByLessonId(lessonId: LessonId): Promise<LessonBundle | null> {
    const result = await this.db
      .select()
      .from(lessonBundlesTable)
      .where(
        and(
          eq(lessonBundlesTable.lessonId, lessonId.toValue()),
          eq(lessonBundlesTable.isActive, true)
        )
      );

    if (!result || result.length === 0) {
      return null;
    }

    const bundleResult = LessonBundleMapper.toDomain(result[0]!);
    return bundleResult.isOk ? bundleResult.getValue() : null;
  }

  async getNextVersion(lessonId: LessonId): Promise<number> {
    const result = await this.db
      .select({ maxVersion: sql<number>`COALESCE(MAX(${lessonBundlesTable.version}), 0)` })
      .from(lessonBundlesTable)
      .where(eq(lessonBundlesTable.lessonId, lessonId.toValue()));

    const maxVersion = result[0]?.maxVersion ?? 0;
    return maxVersion + 1;
  }

  async deactivateAllForLesson(lessonId: LessonId): Promise<void> {
    await this.db
      .update(lessonBundlesTable)
      .set({ isActive: false })
      .where(eq(lessonBundlesTable.lessonId, lessonId.toValue()));
  }
}
