import { eq, asc, sql, and } from 'drizzle-orm';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import type { ISectionRepository } from '../../../domain/repositories/ISectionRepository.ts';
import { Section } from '../../../domain/entities/Section.ts';
import { SectionId } from '../../../domain/value-objects/SectionId.ts';
import { LessonId } from '../../../domain/value-objects/LessonId.ts';
import { sectionsTable } from './schema.ts';
import { CourseMapper } from './CourseMapper.ts';

/**
 * DrizzleSectionRepository
 * Implements ISectionRepository using Drizzle ORM with PostgreSQL
 */
export class DrizzleSectionRepository implements ISectionRepository {
  constructor(private dbProvider: IDatabaseProvider) {}

  private get db(): DrizzleDatabase {
    return this.dbProvider.getDb();
  }

  async save(section: Section): Promise<void> {
    const data = CourseMapper.sectionToPersistence(section);

    // Check if section already exists
    const existingSection = await this.db
      .select()
      .from(sectionsTable)
      .where(eq(sectionsTable.id, section.getId().toValue()));

    if (existingSection && existingSection.length > 0) {
      // Update existing section
      await this.db
        .update(sectionsTable)
        .set(data)
        .where(eq(sectionsTable.id, section.getId().toValue()));
    } else {
      // Insert new section
      await this.db.insert(sectionsTable).values(data);
    }
  }

  async findById(id: SectionId): Promise<Section | null> {
    const result = await this.db
      .select()
      .from(sectionsTable)
      .where(eq(sectionsTable.id, id.toValue()));

    if (!result || result.length === 0) {
      return null;
    }

    const sectionResult = CourseMapper.sectionToDomain(result[0]!);
    return sectionResult.isOk ? sectionResult.getValue() : null;
  }

  async findByLesson(lessonId: LessonId): Promise<Section[]> {
    const sectionRows = await this.db
      .select()
      .from(sectionsTable)
      .where(eq(sectionsTable.lessonId, lessonId.toValue()))
      .orderBy(asc(sectionsTable.order));

    const sections: Section[] = [];
    for (const sectionRow of sectionRows) {
      const sectionResult = CourseMapper.sectionToDomain(sectionRow);
      if (sectionResult.isOk) {
        sections.push(sectionResult.getValue());
      }
    }

    return sections;
  }

  async existsByLessonAndOrder(lessonId: LessonId, order: number): Promise<boolean> {
    const result = await this.db
      .select({ id: sectionsTable.id })
      .from(sectionsTable)
      .where(
        and(
          eq(sectionsTable.lessonId, lessonId.toValue()),
          eq(sectionsTable.order, order)
        )
      );

    return result && result.length > 0;
  }

  async countByLesson(lessonId: LessonId): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(sectionsTable)
      .where(eq(sectionsTable.lessonId, lessonId.toValue()));

    return Number(result[0]?.count ?? 0);
  }

  async delete(id: SectionId): Promise<void> {
    await this.db
      .delete(sectionsTable)
      .where(eq(sectionsTable.id, id.toValue()));
  }

  async deleteByLesson(lessonId: LessonId): Promise<void> {
    await this.db
      .delete(sectionsTable)
      .where(eq(sectionsTable.lessonId, lessonId.toValue()));
  }

  async getNextOrder(lessonId: LessonId): Promise<number> {
    const result = await this.db
      .select({ maxOrder: sql<number>`COALESCE(MAX(${sectionsTable.order}), 0)` })
      .from(sectionsTable)
      .where(eq(sectionsTable.lessonId, lessonId.toValue()));

    return Number(result[0]?.maxOrder ?? 0) + 1;
  }
}
