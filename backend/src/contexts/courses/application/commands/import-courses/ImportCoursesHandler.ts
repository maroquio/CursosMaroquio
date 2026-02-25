import JSZip from 'jszip';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { Result } from '@shared/domain/Result.ts';
import type { IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import {
  coursesTable,
  modulesTable,
  lessonsTable,
  sectionsTable,
  sectionBundlesTable,
  lessonBundlesTable,
} from '@courses/infrastructure/persistence/drizzle/schema.ts';

export interface ImportCoursesResult {
  coursesUpserted: number;
  modulesUpserted: number;
  lessonsUpserted: number;
  sectionsUpserted: number;
  bundlesUpserted: number;
  bundleFilesExtracted: number;
  errors: string[];
}

/**
 * ImportCoursesHandler
 * Imports courses from a ZIP exported by ExportCoursesHandler.
 * Uses upsert (ON CONFLICT DO UPDATE) to handle existing records.
 */
export class ImportCoursesHandler {
  constructor(
    private dbProvider: IDatabaseProvider,
    private bundleStoragePath: string = './uploads/bundles'
  ) {}

  async execute(zipBuffer: Buffer): Promise<Result<ImportCoursesResult>> {
    const errors: string[] = [];
    const result: ImportCoursesResult = {
      coursesUpserted: 0,
      modulesUpserted: 0,
      lessonsUpserted: 0,
      sectionsUpserted: 0,
      bundlesUpserted: 0,
      bundleFilesExtracted: 0,
      errors,
    };

    try {
      const zip = await JSZip.loadAsync(zipBuffer);

      // Parse data.json
      const dataFile = zip.file('data.json');
      if (!dataFile) {
        return Result.fail('Invalid ZIP: missing data.json');
      }

      const dataJson = await dataFile.async('string');
      const data = JSON.parse(dataJson);

      const db = this.dbProvider.getDb();

      // Upsert courses
      if (data.courses?.length) {
        for (const course of data.courses) {
          try {
            await db
              .insert(coursesTable)
              .values(course)
              .onConflictDoUpdate({
                target: coursesTable.id,
                set: {
                  title: course.title,
                  slug: course.slug,
                  description: course.description,
                  thumbnailUrl: course.thumbnailUrl,
                  bannerUrl: course.bannerUrl,
                  shortDescription: course.shortDescription,
                  price: course.price,
                  currency: course.currency,
                  level: course.level,
                  categoryId: course.categoryId,
                  tags: course.tags,
                  status: course.status,
                  instructorId: course.instructorId,
                  updatedAt: course.updatedAt,
                  publishedAt: course.publishedAt,
                  exerciseCorrectionPrompt: course.exerciseCorrectionPrompt,
                },
              });
            result.coursesUpserted++;
          } catch (err) {
            errors.push(`Course ${course.id}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      // Upsert modules
      if (data.modules?.length) {
        for (const module of data.modules) {
          try {
            await db
              .insert(modulesTable)
              .values(module)
              .onConflictDoUpdate({
                target: modulesTable.id,
                set: {
                  courseId: module.courseId,
                  title: module.title,
                  description: module.description,
                  order: module.order,
                  updatedAt: module.updatedAt,
                  exerciseCorrectionPrompt: module.exerciseCorrectionPrompt,
                },
              });
            result.modulesUpserted++;
          } catch (err) {
            errors.push(`Module ${module.id}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      // Upsert lessons
      if (data.lessons?.length) {
        for (const lesson of data.lessons) {
          try {
            await db
              .insert(lessonsTable)
              .values(lesson)
              .onConflictDoUpdate({
                target: lessonsTable.id,
                set: {
                  moduleId: lesson.moduleId,
                  title: lesson.title,
                  slug: lesson.slug,
                  description: lesson.description,
                  content: lesson.content,
                  videoUrl: lesson.videoUrl,
                  duration: lesson.duration,
                  type: lesson.type,
                  isFree: lesson.isFree,
                  isPublished: lesson.isPublished,
                  order: lesson.order,
                  updatedAt: lesson.updatedAt,
                  exerciseCorrectionPrompt: lesson.exerciseCorrectionPrompt,
                },
              });
            result.lessonsUpserted++;
          } catch (err) {
            errors.push(`Lesson ${lesson.id}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      // Upsert sections
      if (data.sections?.length) {
        for (const section of data.sections) {
          try {
            await db
              .insert(sectionsTable)
              .values(section)
              .onConflictDoUpdate({
                target: sectionsTable.id,
                set: {
                  lessonId: section.lessonId,
                  title: section.title,
                  description: section.description,
                  contentType: section.contentType,
                  content: section.content,
                  order: section.order,
                  updatedAt: section.updatedAt,
                },
              });
            result.sectionsUpserted++;
          } catch (err) {
            errors.push(`Section ${section.id}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      // Upsert section bundles
      if (data.sectionBundles?.length) {
        for (const bundle of data.sectionBundles) {
          try {
            await db
              .insert(sectionBundlesTable)
              .values(bundle)
              .onConflictDoUpdate({
                target: sectionBundlesTable.id,
                set: {
                  sectionId: bundle.sectionId,
                  version: bundle.version,
                  entrypoint: bundle.entrypoint,
                  storagePath: bundle.storagePath,
                  manifestJson: bundle.manifestJson,
                  isActive: bundle.isActive,
                },
              });
            result.bundlesUpserted++;
          } catch (err) {
            errors.push(`SectionBundle ${bundle.id}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      // Upsert lesson bundles
      if (data.lessonBundles?.length) {
        for (const bundle of data.lessonBundles) {
          try {
            await db
              .insert(lessonBundlesTable)
              .values(bundle)
              .onConflictDoUpdate({
                target: lessonBundlesTable.id,
                set: {
                  lessonId: bundle.lessonId,
                  version: bundle.version,
                  entrypoint: bundle.entrypoint,
                  storagePath: bundle.storagePath,
                  manifestJson: bundle.manifestJson,
                  isActive: bundle.isActive,
                },
              });
            result.bundlesUpserted++;
          } catch (err) {
            errors.push(`LessonBundle ${bundle.id}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      // Extract bundle files from the ZIP
      const bundlePrefix = 'bundles/';
      for (const [path, file] of Object.entries(zip.files)) {
        if (path.startsWith(bundlePrefix) && !file.dir) {
          try {
            const relativePath = path.slice(bundlePrefix.length);
            const destPath = join(this.bundleStoragePath, relativePath);
            const destDir = dirname(destPath);
            await mkdir(destDir, { recursive: true });
            const fileContent = await file.async('nodebuffer');
            await writeFile(destPath, fileContent);
            result.bundleFilesExtracted++;
          } catch (err) {
            errors.push(`File ${path}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }

      return Result.ok(result);
    } catch (error) {
      return Result.fail(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
