import { mkdir, rm, readFile, access, stat } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { join, dirname } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { type IStorageService, type UploadResult } from './IStorageService.ts';
import { type BundleManifest } from '../../domain/entities/LessonBundle.ts';
import { type SectionBundleManifest } from '../../domain/entities/SectionBundle.ts';

// Import yauzl for ZIP extraction (works in Bun)
import yauzl, { type ZipFile, type Entry } from 'yauzl';
import type { Readable as ReadableStream } from 'node:stream';

/**
 * LocalStorageService
 * Implements IStorageService for local filesystem storage
 * Bundles are stored as extracted directories under basePath
 */
export class LocalStorageService implements IStorageService {
  private basePath: string;

  constructor(basePath: string = './uploads/bundles') {
    this.basePath = basePath;
  }

  async uploadBundle(lessonId: string, version: number, file: Buffer): Promise<UploadResult> {
    const storagePath = `${lessonId}/v${version}`;
    const fullPath = join(this.basePath, storagePath);

    // Create the directory
    await mkdir(fullPath, { recursive: true });

    // Extract ZIP to directory
    await this.extractZip(file, fullPath);

    // Calculate total size
    const size = file.length;

    return { storagePath, size };
  }

  async deleteBundle(storagePath: string): Promise<void> {
    const fullPath = join(this.basePath, storagePath);

    try {
      await rm(fullPath, { recursive: true, force: true });
    } catch {
      // Ignore errors if directory doesn't exist
    }
  }

  getBundleUrl(storagePath: string): string {
    // Return a relative URL path that can be served statically
    return `/uploads/bundles/${storagePath}`;
  }

  async extractManifest(storagePath: string): Promise<BundleManifest | null> {
    const manifestPath = join(this.basePath, storagePath, 'lesson.json');

    try {
      const content = await readFile(manifestPath, 'utf-8');
      return JSON.parse(content) as BundleManifest;
    } catch {
      return null;
    }
  }

  async entrypointExists(storagePath: string, entrypoint: string): Promise<boolean> {
    const entrypointPath = join(this.basePath, storagePath, entrypoint);

    try {
      await access(entrypointPath);
      return true;
    } catch {
      return false;
    }
  }

  // === Section Bundle Methods ===

  async uploadSectionBundle(sectionId: string, version: number, file: Buffer): Promise<UploadResult> {
    const storagePath = `sections/${sectionId}/v${version}`;
    const fullPath = join(this.basePath, storagePath);

    // Create the directory
    await mkdir(fullPath, { recursive: true });

    // Extract ZIP to directory
    await this.extractZip(file, fullPath);

    // Calculate total size
    const size = file.length;

    return { storagePath, size };
  }

  async deleteSectionBundle(storagePath: string): Promise<void> {
    const fullPath = join(this.basePath, storagePath);

    try {
      await rm(fullPath, { recursive: true, force: true });
    } catch {
      // Ignore errors if directory doesn't exist
    }
  }

  getSectionBundleUrl(storagePath: string): string {
    // Return a relative URL path that can be served statically
    return `/uploads/bundles/${storagePath}`;
  }

  async extractSectionManifest(storagePath: string): Promise<SectionBundleManifest | null> {
    // Try section.json first
    const sectionManifestPath = join(this.basePath, storagePath, 'section.json');
    try {
      const content = await readFile(sectionManifestPath, 'utf-8');
      return JSON.parse(content) as SectionBundleManifest;
    } catch {
      // Fall back to lesson.json for backwards compatibility
      const lessonManifestPath = join(this.basePath, storagePath, 'lesson.json');
      try {
        const content = await readFile(lessonManifestPath, 'utf-8');
        return JSON.parse(content) as SectionBundleManifest;
      } catch {
        return null;
      }
    }
  }

  async sectionEntrypointExists(storagePath: string, entrypoint: string): Promise<boolean> {
    const entrypointPath = join(this.basePath, storagePath, entrypoint);

    try {
      await access(entrypointPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract a ZIP buffer to a directory
   */
  private async extractZip(zipBuffer: Buffer, targetDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      yauzl.fromBuffer(zipBuffer, { lazyEntries: true }, (err: Error | null, zipfile: ZipFile | undefined) => {
        if (err) {
          reject(err);
          return;
        }

        if (!zipfile) {
          reject(new Error('Failed to open ZIP file'));
          return;
        }

        zipfile.readEntry();

        zipfile.on('entry', async (entry: Entry) => {
          const entryPath = join(targetDir, entry.fileName);

          // Check for path traversal attacks
          if (!entryPath.startsWith(targetDir)) {
            zipfile.close();
            reject(new Error('Invalid ZIP entry path'));
            return;
          }

          if (/\/$/.test(entry.fileName)) {
            // Directory entry
            try {
              await mkdir(entryPath, { recursive: true });
              zipfile.readEntry();
            } catch (mkdirErr) {
              zipfile.close();
              reject(mkdirErr);
            }
          } else {
            // File entry
            zipfile.openReadStream(entry, async (streamErr: Error | null, readStream: ReadableStream | undefined) => {
              if (streamErr) {
                zipfile.close();
                reject(streamErr);
                return;
              }

              if (!readStream) {
                zipfile.close();
                reject(new Error('Failed to open read stream'));
                return;
              }

              try {
                // Ensure parent directory exists
                await mkdir(dirname(entryPath), { recursive: true });

                const writeStream = createWriteStream(entryPath);
                await pipeline(readStream, writeStream);
                zipfile.readEntry();
              } catch (pipeErr) {
                zipfile.close();
                reject(pipeErr);
              }
            });
          }
        });

        zipfile.on('end', () => {
          resolve();
        });

        zipfile.on('error', (zipErr: Error) => {
          reject(zipErr);
        });
      });
    });
  }
}
