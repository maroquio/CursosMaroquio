import JSZip from 'jszip';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Result } from '@shared/domain/Result.ts';
import type { IDatabaseProvider } from '@shared/infrastructure/database/types.ts';
import { coursesTable } from '@courses/infrastructure/persistence/drizzle/schema.ts';
import { modulesTable } from '@courses/infrastructure/persistence/drizzle/schema.ts';
import { lessonsTable } from '@courses/infrastructure/persistence/drizzle/schema.ts';
import { sectionsTable } from '@courses/infrastructure/persistence/drizzle/schema.ts';
import { sectionBundlesTable } from '@courses/infrastructure/persistence/drizzle/schema.ts';
import { lessonBundlesTable } from '@courses/infrastructure/persistence/drizzle/schema.ts';
import { eq } from 'drizzle-orm';

/**
 * ExportCoursesHandler
 * Exports all courses with their full hierarchy and bundle files as a ZIP.
 * Returns a Buffer containing the ZIP file.
 */
export class ExportCoursesHandler {
  constructor(
    private dbProvider: IDatabaseProvider,
    private bundleStoragePath: string = './uploads/bundles'
  ) {}

  async execute(): Promise<Result<Buffer>> {
    try {
      const db = this.dbProvider.getDb();

      // Fetch all courses
      const courses = await db.select().from(coursesTable);

      // Fetch all modules
      const modules = await db.select().from(modulesTable);

      // Fetch all lessons
      const lessons = await db.select().from(lessonsTable);

      // Fetch all sections
      const sections = await db.select().from(sectionsTable);

      // Fetch all section bundles
      const sectionBundles = await db.select().from(sectionBundlesTable);

      // Fetch all lesson bundles
      const lessonBundles = await db.select().from(lessonBundlesTable);

      const zip = new JSZip();

      // Add data.json
      const data = {
        exportedAt: new Date().toISOString(),
        courses,
        modules,
        lessons,
        sections,
        sectionBundles,
        lessonBundles,
      };

      zip.file('data.json', JSON.stringify(data, null, 2));

      // Add bundle files for active section bundles
      for (const bundle of sectionBundles) {
        if (bundle.isActive && bundle.storagePath) {
          const fullPath = join(this.bundleStoragePath, bundle.storagePath);
          await this.addDirectoryToZip(zip, fullPath, `bundles/${bundle.storagePath}`);
        }
      }

      // Add bundle files for active lesson bundles
      for (const bundle of lessonBundles) {
        if (bundle.isActive && bundle.storagePath) {
          const fullPath = join(this.bundleStoragePath, bundle.storagePath);
          await this.addDirectoryToZip(zip, fullPath, `bundles/${bundle.storagePath}`);
        }
      }

      const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      return Result.ok(buffer);
    } catch (error) {
      return Result.fail(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async addDirectoryToZip(zip: JSZip, dirPath: string, zipPath: string): Promise<void> {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        const entryZipPath = `${zipPath}/${entry.name}`;
        if (entry.isDirectory()) {
          await this.addDirectoryToZip(zip, fullPath, entryZipPath);
        } else {
          const fileContent = await readFile(fullPath);
          zip.file(entryZipPath, fileContent);
        }
      }
    } catch {
      // Directory may not exist (bundle was deleted from disk), skip silently
    }
  }
}
