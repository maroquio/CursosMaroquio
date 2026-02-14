import { eq, and, sql } from 'drizzle-orm';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import { type ILessonProgressRepository } from '../../../domain/repositories/ILessonProgressRepository.ts';
import { LessonProgress } from '../../../domain/entities/LessonProgress.ts';
import { EnrollmentId } from '../../../domain/value-objects/EnrollmentId.ts';
import { LessonId } from '../../../domain/value-objects/LessonId.ts';
import { LessonProgressStatus } from '../../../domain/value-objects/LessonProgressStatus.ts';
import { lessonProgressTable } from './schema.ts';
import { LessonProgressMapper } from './LessonProgressMapper.ts';

/**
 * DrizzleLessonProgressRepository
 * Implements ILessonProgressRepository using Drizzle ORM with PostgreSQL
 */
export class DrizzleLessonProgressRepository implements ILessonProgressRepository {
  constructor(private dbProvider: IDatabaseProvider) {}

  private get db(): DrizzleDatabase {
    return this.dbProvider.getDb();
  }

  async save(progress: LessonProgress): Promise<void> {
    const data = LessonProgressMapper.toPersistence(progress);

    // Check if progress already exists
    const existing = await this.db
      .select()
      .from(lessonProgressTable)
      .where(eq(lessonProgressTable.id, progress.getProgressId()));

    if (existing && existing.length > 0) {
      // Update
      await this.db
        .update(lessonProgressTable)
        .set(data)
        .where(eq(lessonProgressTable.id, progress.getProgressId()));
    } else {
      // Insert
      await this.db.insert(lessonProgressTable).values(data);
    }
  }

  async findByEnrollmentAndLesson(
    enrollmentId: EnrollmentId,
    lessonId: LessonId
  ): Promise<LessonProgress | null> {
    const result = await this.db
      .select()
      .from(lessonProgressTable)
      .where(
        and(
          eq(lessonProgressTable.enrollmentId, enrollmentId.toValue()),
          eq(lessonProgressTable.lessonId, lessonId.toValue())
        )
      );

    if (!result || result.length === 0) {
      return null;
    }

    const progressResult = LessonProgressMapper.toDomain(result[0]!);
    return progressResult.isOk ? progressResult.getValue() : null;
  }

  async findByEnrollment(enrollmentId: EnrollmentId): Promise<LessonProgress[]> {
    const result = await this.db
      .select()
      .from(lessonProgressTable)
      .where(eq(lessonProgressTable.enrollmentId, enrollmentId.toValue()));

    const progresses: LessonProgress[] = [];
    for (const row of result) {
      const progressResult = LessonProgressMapper.toDomain(row);
      if (progressResult.isOk) {
        progresses.push(progressResult.getValue());
      }
    }

    return progresses;
  }

  async countCompletedByEnrollment(enrollmentId: EnrollmentId): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(lessonProgressTable)
      .where(
        and(
          eq(lessonProgressTable.enrollmentId, enrollmentId.toValue()),
          eq(lessonProgressTable.status, LessonProgressStatus.COMPLETED)
        )
      );

    return Number(result[0]?.count ?? 0);
  }

  async countByEnrollmentAndStatus(
    enrollmentId: EnrollmentId,
    status: LessonProgressStatus
  ): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(lessonProgressTable)
      .where(
        and(
          eq(lessonProgressTable.enrollmentId, enrollmentId.toValue()),
          eq(lessonProgressTable.status, status)
        )
      );

    return Number(result[0]?.count ?? 0);
  }

  async deleteByEnrollment(enrollmentId: EnrollmentId): Promise<void> {
    await this.db
      .delete(lessonProgressTable)
      .where(eq(lessonProgressTable.enrollmentId, enrollmentId.toValue()));
  }

  async deleteByLesson(lessonId: LessonId): Promise<void> {
    await this.db
      .delete(lessonProgressTable)
      .where(eq(lessonProgressTable.lessonId, lessonId.toValue()));
  }
}
