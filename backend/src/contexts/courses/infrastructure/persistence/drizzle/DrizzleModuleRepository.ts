import { eq, asc, sql, and } from 'drizzle-orm';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import type { IModuleRepository } from '../../../domain/repositories/IModuleRepository.ts';
import { Module } from '../../../domain/entities/Module.ts';
import { Lesson } from '../../../domain/entities/Lesson.ts';
import { Section } from '../../../domain/entities/Section.ts';
import { ModuleId } from '../../../domain/value-objects/ModuleId.ts';
import { CourseId } from '../../../domain/value-objects/CourseId.ts';
import { LessonId } from '../../../domain/value-objects/LessonId.ts';
import { modulesTable, lessonsTable, sectionsTable } from './schema.ts';
import { CourseMapper } from './CourseMapper.ts';

/**
 * DrizzleModuleRepository
 * Implements IModuleRepository using Drizzle ORM with PostgreSQL
 */
export class DrizzleModuleRepository implements IModuleRepository {
  constructor(private dbProvider: IDatabaseProvider) {}

  private get db(): DrizzleDatabase {
    return this.dbProvider.getDb();
  }

  async save(module: Module): Promise<void> {
    const data = CourseMapper.moduleToPersistence(module);

    // Check if module already exists
    const existingModule = await this.db
      .select()
      .from(modulesTable)
      .where(eq(modulesTable.id, module.getId().toValue()));

    if (existingModule && existingModule.length > 0) {
      // Update existing module
      await this.db
        .update(modulesTable)
        .set(data)
        .where(eq(modulesTable.id, module.getId().toValue()));
    } else {
      // Insert new module
      await this.db.insert(modulesTable).values(data);
    }

    // Sync lessons
    await this.syncLessons(module);
  }

  private async syncLessons(module: Module): Promise<void> {
    const moduleId = module.getId().toValue();
    const lessons = module.getLessons();

    // Get existing lesson IDs
    const existingLessons = await this.db
      .select({ id: lessonsTable.id })
      .from(lessonsTable)
      .where(eq(lessonsTable.moduleId, moduleId));

    const existingLessonIds = new Set(existingLessons.map(l => l.id));
    const currentLessonIds = new Set(lessons.map(l => l.getId().toValue()));

    // Delete removed lessons
    for (const existingId of existingLessonIds) {
      if (!currentLessonIds.has(existingId)) {
        await this.db
          .delete(lessonsTable)
          .where(eq(lessonsTable.id, existingId));
      }
    }

    // Insert or update lessons
    for (const lesson of lessons) {
      const lessonData = CourseMapper.lessonToPersistence(lesson);

      if (existingLessonIds.has(lesson.getId().toValue())) {
        await this.db
          .update(lessonsTable)
          .set(lessonData)
          .where(eq(lessonsTable.id, lesson.getId().toValue()));
      } else {
        await this.db.insert(lessonsTable).values(lessonData);
      }

      // Sync sections for this lesson
      await this.syncSections(lesson);
    }
  }

  private async syncSections(lesson: Lesson): Promise<void> {
    const lessonId = lesson.getId().toValue();
    const sections = lesson.getSections();

    // Get existing section IDs
    const existingSections = await this.db
      .select({ id: sectionsTable.id })
      .from(sectionsTable)
      .where(eq(sectionsTable.lessonId, lessonId));

    const existingSectionIds = new Set(existingSections.map(s => s.id));
    const currentSectionIds = new Set(sections.map(s => s.getId().toValue()));

    // Delete removed sections
    for (const existingId of existingSectionIds) {
      if (!currentSectionIds.has(existingId)) {
        await this.db
          .delete(sectionsTable)
          .where(eq(sectionsTable.id, existingId));
      }
    }

    // Insert or update sections
    for (const section of sections) {
      const sectionData = CourseMapper.sectionToPersistence(section);

      if (existingSectionIds.has(section.getId().toValue())) {
        await this.db
          .update(sectionsTable)
          .set(sectionData)
          .where(eq(sectionsTable.id, section.getId().toValue()));
      } else {
        await this.db.insert(sectionsTable).values(sectionData);
      }
    }
  }

  async findById(id: ModuleId): Promise<Module | null> {
    const result = await this.db
      .select()
      .from(modulesTable)
      .where(eq(modulesTable.id, id.toValue()));

    if (!result || result.length === 0) {
      return null;
    }

    const lessons = await this.loadLessons(id.toValue());
    const moduleResult = CourseMapper.moduleToDomain(result[0]!, lessons);
    return moduleResult.isOk ? moduleResult.getValue() : null;
  }

  async findByCourse(courseId: CourseId): Promise<Module[]> {
    const moduleRows = await this.db
      .select()
      .from(modulesTable)
      .where(eq(modulesTable.courseId, courseId.toValue()))
      .orderBy(asc(modulesTable.order));

    const modules: Module[] = [];
    for (const moduleRow of moduleRows) {
      const lessons = await this.loadLessons(moduleRow.id);
      const moduleResult = CourseMapper.moduleToDomain(moduleRow, lessons);
      if (moduleResult.isOk) {
        modules.push(moduleResult.getValue());
      }
    }

    return modules;
  }

  async existsByCourseAndOrder(courseId: CourseId, order: number): Promise<boolean> {
    const result = await this.db
      .select({ id: modulesTable.id })
      .from(modulesTable)
      .where(
        and(
          eq(modulesTable.courseId, courseId.toValue()),
          eq(modulesTable.order, order)
        )
      );

    return result && result.length > 0;
  }

  async countByCourse(courseId: CourseId): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(modulesTable)
      .where(eq(modulesTable.courseId, courseId.toValue()));

    return Number(result[0]?.count ?? 0);
  }

  async delete(id: ModuleId): Promise<void> {
    await this.db
      .delete(modulesTable)
      .where(eq(modulesTable.id, id.toValue()));
  }

  async deleteByCourse(courseId: CourseId): Promise<void> {
    await this.db
      .delete(modulesTable)
      .where(eq(modulesTable.courseId, courseId.toValue()));
  }

  async getNextOrder(courseId: CourseId): Promise<number> {
    const result = await this.db
      .select({ maxOrder: sql<number>`COALESCE(MAX(${modulesTable.order}), 0)` })
      .from(modulesTable)
      .where(eq(modulesTable.courseId, courseId.toValue()));

    return Number(result[0]?.maxOrder ?? 0) + 1;
  }

  async findByLessonId(lessonId: LessonId): Promise<Module | null> {
    // Find the lesson to get its moduleId
    const lessonResult = await this.db
      .select({ moduleId: lessonsTable.moduleId })
      .from(lessonsTable)
      .where(eq(lessonsTable.id, lessonId.toValue()));

    if (!lessonResult || lessonResult.length === 0) {
      return null;
    }

    const moduleId = lessonResult[0]!.moduleId;
    const moduleIdResult = ModuleId.createFromString(moduleId);
    if (moduleIdResult.isFailure) {
      return null;
    }

    return this.findById(moduleIdResult.getValue());
  }

  private async loadLessons(moduleId: string): Promise<Lesson[]> {
    const lessonRows = await this.db
      .select()
      .from(lessonsTable)
      .where(eq(lessonsTable.moduleId, moduleId))
      .orderBy(asc(lessonsTable.order));

    const lessons: Lesson[] = [];
    for (const lessonRow of lessonRows) {
      const sections = await this.loadSections(lessonRow.id);
      const lessonResult = CourseMapper.lessonToDomain(lessonRow, sections);
      if (lessonResult.isOk) {
        lessons.push(lessonResult.getValue());
      }
    }

    return lessons;
  }

  private async loadSections(lessonId: string): Promise<Section[]> {
    const sectionRows = await this.db
      .select()
      .from(sectionsTable)
      .where(eq(sectionsTable.lessonId, lessonId))
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
}
