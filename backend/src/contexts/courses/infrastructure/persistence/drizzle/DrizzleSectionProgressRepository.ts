import { eq, and, sql, inArray } from 'drizzle-orm';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import type { ISectionProgressRepository } from '../../../domain/repositories/ISectionProgressRepository.ts';
import { SectionProgress } from '../../../domain/entities/SectionProgress.ts';
import { SectionProgressId } from '../../../domain/value-objects/SectionProgressId.ts';
import { EnrollmentId } from '../../../domain/value-objects/EnrollmentId.ts';
import { SectionId } from '../../../domain/value-objects/SectionId.ts';
import { LessonId } from '../../../domain/value-objects/LessonId.ts';
import { LessonProgressStatus } from '../../../domain/value-objects/LessonProgressStatus.ts';
import { sectionProgressTable, sectionsTable } from './schema.ts';
import { CourseMapper } from './CourseMapper.ts';

/**
 * DrizzleSectionProgressRepository
 * Implements ISectionProgressRepository using Drizzle ORM with PostgreSQL
 */
export class DrizzleSectionProgressRepository implements ISectionProgressRepository {
  constructor(private dbProvider: IDatabaseProvider) {}

  private get db(): DrizzleDatabase {
    return this.dbProvider.getDb();
  }

  async save(progress: SectionProgress): Promise<void> {
    const data = CourseMapper.sectionProgressToPersistence(progress);

    // Check if progress already exists
    const existingProgress = await this.db
      .select()
      .from(sectionProgressTable)
      .where(eq(sectionProgressTable.id, progress.getId().toValue()));

    if (existingProgress && existingProgress.length > 0) {
      // Update existing progress
      await this.db
        .update(sectionProgressTable)
        .set(data)
        .where(eq(sectionProgressTable.id, progress.getId().toValue()));
    } else {
      // Insert new progress
      await this.db.insert(sectionProgressTable).values(data);
    }
  }

  async findById(id: SectionProgressId): Promise<SectionProgress | null> {
    const result = await this.db
      .select()
      .from(sectionProgressTable)
      .where(eq(sectionProgressTable.id, id.toValue()));

    if (!result || result.length === 0) {
      return null;
    }

    const progressResult = CourseMapper.sectionProgressToDomain(result[0]!);
    return progressResult.isOk ? progressResult.getValue() : null;
  }

  async findByEnrollmentAndSection(
    enrollmentId: EnrollmentId,
    sectionId: SectionId
  ): Promise<SectionProgress | null> {
    const result = await this.db
      .select()
      .from(sectionProgressTable)
      .where(
        and(
          eq(sectionProgressTable.enrollmentId, enrollmentId.toValue()),
          eq(sectionProgressTable.sectionId, sectionId.toValue())
        )
      );

    if (!result || result.length === 0) {
      return null;
    }

    const progressResult = CourseMapper.sectionProgressToDomain(result[0]!);
    return progressResult.isOk ? progressResult.getValue() : null;
  }

  async findByEnrollment(enrollmentId: EnrollmentId): Promise<SectionProgress[]> {
    const progressRows = await this.db
      .select()
      .from(sectionProgressTable)
      .where(eq(sectionProgressTable.enrollmentId, enrollmentId.toValue()));

    const progressList: SectionProgress[] = [];
    for (const row of progressRows) {
      const progressResult = CourseMapper.sectionProgressToDomain(row);
      if (progressResult.isOk) {
        progressList.push(progressResult.getValue());
      }
    }

    return progressList;
  }

  async findByEnrollmentAndLesson(
    enrollmentId: EnrollmentId,
    lessonId: LessonId
  ): Promise<SectionProgress[]> {
    // First get all section IDs for this lesson
    const sectionIds = await this.db
      .select({ id: sectionsTable.id })
      .from(sectionsTable)
      .where(eq(sectionsTable.lessonId, lessonId.toValue()));

    if (sectionIds.length === 0) {
      return [];
    }

    // Then get progress for those sections
    const progressRows = await this.db
      .select()
      .from(sectionProgressTable)
      .where(
        and(
          eq(sectionProgressTable.enrollmentId, enrollmentId.toValue()),
          inArray(sectionProgressTable.sectionId, sectionIds.map(s => s.id))
        )
      );

    const progressList: SectionProgress[] = [];
    for (const row of progressRows) {
      const progressResult = CourseMapper.sectionProgressToDomain(row);
      if (progressResult.isOk) {
        progressList.push(progressResult.getValue());
      }
    }

    return progressList;
  }

  async countCompletedByEnrollmentAndLesson(
    enrollmentId: EnrollmentId,
    lessonId: LessonId
  ): Promise<number> {
    // First get all section IDs for this lesson
    const sectionIds = await this.db
      .select({ id: sectionsTable.id })
      .from(sectionsTable)
      .where(eq(sectionsTable.lessonId, lessonId.toValue()));

    if (sectionIds.length === 0) {
      return 0;
    }

    // Count completed progress records
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(sectionProgressTable)
      .where(
        and(
          eq(sectionProgressTable.enrollmentId, enrollmentId.toValue()),
          eq(sectionProgressTable.status, LessonProgressStatus.COMPLETED),
          inArray(sectionProgressTable.sectionId, sectionIds.map(s => s.id))
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
      .from(sectionProgressTable)
      .where(
        and(
          eq(sectionProgressTable.enrollmentId, enrollmentId.toValue()),
          eq(sectionProgressTable.status, status)
        )
      );

    return Number(result[0]?.count ?? 0);
  }

  async areAllSectionsCompleted(
    enrollmentId: EnrollmentId,
    lessonId: LessonId,
    totalSections: number
  ): Promise<boolean> {
    const completedCount = await this.countCompletedByEnrollmentAndLesson(enrollmentId, lessonId);
    return completedCount >= totalSections;
  }

  async deleteByEnrollment(enrollmentId: EnrollmentId): Promise<void> {
    await this.db
      .delete(sectionProgressTable)
      .where(eq(sectionProgressTable.enrollmentId, enrollmentId.toValue()));
  }

  async deleteBySection(sectionId: SectionId): Promise<void> {
    await this.db
      .delete(sectionProgressTable)
      .where(eq(sectionProgressTable.sectionId, sectionId.toValue()));
  }

  async getOrCreate(enrollmentId: EnrollmentId, sectionId: SectionId): Promise<SectionProgress> {
    // Try to find existing progress
    const existing = await this.findByEnrollmentAndSection(enrollmentId, sectionId);
    if (existing) {
      return existing;
    }

    // Create new progress
    const progressResult = SectionProgress.create(enrollmentId, sectionId);
    if (progressResult.isFailure) {
      throw new Error('Failed to create section progress');
    }

    const progress = progressResult.getValue();
    await this.save(progress);
    return progress;
  }
}
