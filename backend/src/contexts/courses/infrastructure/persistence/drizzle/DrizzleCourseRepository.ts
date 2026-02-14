import { eq, and, ilike, sql, type SQL, asc, inArray } from 'drizzle-orm';
import type { DrizzleDatabase, IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import {
  type ICourseRepository,
  type CourseFilters,
  type PaginatedCourses,
} from '../../../domain/repositories/ICourseRepository.ts';
import { Course } from '../../../domain/entities/Course.ts';
import { Module } from '../../../domain/entities/Module.ts';
import { Lesson } from '../../../domain/entities/Lesson.ts';
import { Section } from '../../../domain/entities/Section.ts';
import { CourseId } from '../../../domain/value-objects/CourseId.ts';
import { Slug } from '../../../domain/value-objects/Slug.ts';
import { CourseStatus } from '../../../domain/value-objects/CourseStatus.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { coursesTable, modulesTable, lessonsTable, sectionsTable } from './schema.ts';
import { CourseMapper } from './CourseMapper.ts';

/**
 * DrizzleCourseRepository
 * Implements ICourseRepository using Drizzle ORM with PostgreSQL
 */
export class DrizzleCourseRepository implements ICourseRepository {
  constructor(private dbProvider: IDatabaseProvider) {}

  private get db(): DrizzleDatabase {
    return this.dbProvider.getDb();
  }

  async save(course: Course): Promise<void> {
    const data = CourseMapper.toPersistence(course);

    // Check if course already exists
    const existingCourse = await this.db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.id, course.getId().toValue()));

    if (existingCourse && existingCourse.length > 0) {
      // Update existing course
      await this.db
        .update(coursesTable)
        .set(data)
        .where(eq(coursesTable.id, course.getId().toValue()));
    } else {
      // Insert new course
      await this.db.insert(coursesTable).values(data);
    }

    // Sync modules (which includes lessons and sections)
    await this.syncModules(course);
  }

  private async syncModules(course: Course): Promise<void> {
    const courseId = course.getId().toValue();
    const modules = course.getModules();

    // Get existing module IDs
    const existingModules = await this.db
      .select({ id: modulesTable.id })
      .from(modulesTable)
      .where(eq(modulesTable.courseId, courseId));

    const existingModuleIds = new Set(existingModules.map(m => m.id));
    const currentModuleIds = new Set(modules.map(m => m.getId().toValue()));

    // Delete removed modules (cascade will delete lessons and sections)
    for (const existingId of existingModuleIds) {
      if (!currentModuleIds.has(existingId)) {
        await this.db
          .delete(modulesTable)
          .where(eq(modulesTable.id, existingId));
      }
    }

    // Insert or update modules and their lessons
    for (const module of modules) {
      const moduleData = CourseMapper.moduleToPersistence(module);

      if (existingModuleIds.has(module.getId().toValue())) {
        // Update module
        await this.db
          .update(modulesTable)
          .set(moduleData)
          .where(eq(modulesTable.id, module.getId().toValue()));
      } else {
        // Insert module
        await this.db.insert(modulesTable).values(moduleData);
      }

      // Sync lessons for this module
      await this.syncLessons(module);
    }
  }

  private async syncLessons(module: Module): Promise<void> {
    const moduleId = module.getId().toValue();
    const lessons = module.getLessons();

    // Get existing lesson IDs for this module
    const existingLessons = await this.db
      .select({ id: lessonsTable.id })
      .from(lessonsTable)
      .where(eq(lessonsTable.moduleId, moduleId));

    const existingLessonIds = new Set(existingLessons.map(l => l.id));
    const currentLessonIds = new Set(lessons.map(l => l.getId().toValue()));

    // Delete removed lessons (cascade will delete sections)
    for (const existingId of existingLessonIds) {
      if (!currentLessonIds.has(existingId)) {
        await this.db
          .delete(lessonsTable)
          .where(eq(lessonsTable.id, existingId));
      }
    }

    // Insert or update lessons and their sections
    for (const lesson of lessons) {
      const lessonData = CourseMapper.lessonToPersistence(lesson);

      if (existingLessonIds.has(lesson.getId().toValue())) {
        // Update lesson
        await this.db
          .update(lessonsTable)
          .set(lessonData)
          .where(eq(lessonsTable.id, lesson.getId().toValue()));
      } else {
        // Insert lesson
        await this.db.insert(lessonsTable).values(lessonData);
      }

      // Sync sections for this lesson
      await this.syncSections(lesson);
    }
  }

  private async syncSections(lesson: Lesson): Promise<void> {
    const lessonId = lesson.getId().toValue();
    const sections = lesson.getSections();

    // Get existing section IDs for this lesson
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
        // Update section
        await this.db
          .update(sectionsTable)
          .set(sectionData)
          .where(eq(sectionsTable.id, section.getId().toValue()));
      } else {
        // Insert section
        await this.db.insert(sectionsTable).values(sectionData);
      }
    }
  }

  async findById(id: CourseId): Promise<Course | null> {
    const result = await this.db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.id, id.toValue()));

    if (!result || result.length === 0) {
      return null;
    }

    // Load modules with their lessons and sections
    const modules = await this.loadModules(id.toValue());

    const courseResult = CourseMapper.toDomain(result[0]!, modules);
    return courseResult.isOk ? courseResult.getValue() : null;
  }

  async findBySlug(slug: Slug): Promise<Course | null> {
    const result = await this.db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.slug, slug.getValue()));

    if (!result || result.length === 0) {
      return null;
    }

    const courseId = result[0]!.id;
    const modules = await this.loadModules(courseId);

    const courseResult = CourseMapper.toDomain(result[0]!, modules);
    return courseResult.isOk ? courseResult.getValue() : null;
  }

  async existsBySlug(slug: Slug): Promise<boolean> {
    const result = await this.db
      .select({ id: coursesTable.id })
      .from(coursesTable)
      .where(eq(coursesTable.slug, slug.getValue()));

    return result && result.length > 0;
  }

  async exists(id: CourseId): Promise<boolean> {
    const result = await this.db
      .select({ id: coursesTable.id })
      .from(coursesTable)
      .where(eq(coursesTable.id, id.toValue()));

    return result && result.length > 0;
  }

  async delete(id: CourseId): Promise<void> {
    await this.db
      .delete(coursesTable)
      .where(eq(coursesTable.id, id.toValue()));
  }

  async findAllPaginated(
    page: number,
    limit: number,
    filters?: CourseFilters
  ): Promise<PaginatedCourses> {
    const offset = (page - 1) * limit;
    const conditions = this.buildFilterConditions(filters);

    let query = this.db.select().from(coursesTable);

    if (conditions) {
      query = query.where(conditions) as typeof query;
    }

    const result = await query.limit(limit).offset(offset);

    const courses: Course[] = [];
    for (const row of result) {
      const modules = await this.loadModules(row.id);
      const courseResult = CourseMapper.toDomain(row, modules);
      if (courseResult.isOk) {
        courses.push(courseResult.getValue());
      }
    }

    const total = await this.count(filters);
    const totalPages = Math.ceil(total / limit);

    return {
      courses,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findPublishedPaginated(
    page: number,
    limit: number,
    search?: string
  ): Promise<PaginatedCourses> {
    return this.findAllPaginated(page, limit, {
      status: CourseStatus.PUBLISHED,
      search,
    });
  }

  async findByInstructor(instructorId: UserId): Promise<Course[]> {
    const result = await this.db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.instructorId, instructorId.toValue()));

    const courses: Course[] = [];
    for (const row of result) {
      const modules = await this.loadModules(row.id);
      const courseResult = CourseMapper.toDomain(row, modules);
      if (courseResult.isOk) {
        courses.push(courseResult.getValue());
      }
    }

    return courses;
  }

  async count(filters?: CourseFilters): Promise<number> {
    const conditions = this.buildFilterConditions(filters);

    let query = this.db.select({ count: sql<number>`count(*)` }).from(coursesTable);

    if (conditions) {
      query = query.where(conditions) as typeof query;
    }

    const result = await query;
    return Number(result[0]?.count ?? 0);
  }

  private async loadModules(courseId: string): Promise<Module[]> {
    const moduleRows = await this.db
      .select()
      .from(modulesTable)
      .where(eq(modulesTable.courseId, courseId))
      .orderBy(asc(modulesTable.order));

    const modules: Module[] = [];
    for (const moduleRow of moduleRows) {
      const lessons = await this.loadLessonsForModule(moduleRow.id);
      const moduleResult = CourseMapper.moduleToDomain(moduleRow, lessons);
      if (moduleResult.isOk) {
        modules.push(moduleResult.getValue());
      }
    }

    return modules;
  }

  private async loadLessonsForModule(moduleId: string): Promise<Lesson[]> {
    const lessonRows = await this.db
      .select()
      .from(lessonsTable)
      .where(eq(lessonsTable.moduleId, moduleId))
      .orderBy(asc(lessonsTable.order));

    const lessons: Lesson[] = [];
    for (const lessonRow of lessonRows) {
      const sections = await this.loadSectionsForLesson(lessonRow.id);
      const lessonResult = CourseMapper.lessonToDomain(lessonRow, sections);
      if (lessonResult.isOk) {
        lessons.push(lessonResult.getValue());
      }
    }

    return lessons;
  }

  private async loadSectionsForLesson(lessonId: string): Promise<Section[]> {
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

  private buildFilterConditions(filters?: CourseFilters): SQL | undefined {
    if (!filters) return undefined;

    const conditions: SQL[] = [];

    if (filters.status) {
      conditions.push(eq(coursesTable.status, filters.status));
    }

    if (filters.instructorId) {
      conditions.push(eq(coursesTable.instructorId, filters.instructorId.toValue()));
    }

    if (filters.search) {
      conditions.push(ilike(coursesTable.title, `%${filters.search}%`));
    }

    if (conditions.length === 0) return undefined;
    if (conditions.length === 1) return conditions[0];
    return and(...conditions);
  }
}
