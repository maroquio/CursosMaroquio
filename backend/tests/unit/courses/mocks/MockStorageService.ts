import type { IStorageService, UploadResult } from '@courses/infrastructure/storage/IStorageService.ts';
import type { BundleManifest } from '@courses/domain/entities/LessonBundle.ts';
import type { SectionBundleManifest } from '@courses/domain/entities/SectionBundle.ts';

/**
 * Mock StorageService for testing handlers
 * Simulates file storage operations
 */
export class MockStorageService implements IStorageService {
  private _shouldThrowOnUpload = false;
  private _entrypointExists = true;
  private _sectionManifest: SectionBundleManifest | null = null;
  private _manifest: BundleManifest | null = null;
  private _deletedPaths: string[] = [];

  // === Lesson Bundle Methods ===

  async uploadBundle(lessonId: string, version: number, _file: Buffer): Promise<UploadResult> {
    if (this._shouldThrowOnUpload) {
      throw new Error('Upload failed');
    }
    return {
      storagePath: `bundles/lessons/${lessonId}/v${version}`,
      size: 1024,
    };
  }

  async deleteBundle(storagePath: string): Promise<void> {
    this._deletedPaths.push(storagePath);
  }

  getBundleUrl(storagePath: string): string {
    return `http://localhost:8702/static/${storagePath}`;
  }

  async extractManifest(_storagePath: string): Promise<BundleManifest | null> {
    return this._manifest;
  }

  async entrypointExists(_storagePath: string, _entrypoint: string): Promise<boolean> {
    return this._entrypointExists;
  }

  // === Section Bundle Methods ===

  async uploadSectionBundle(sectionId: string, version: number, _file: Buffer): Promise<UploadResult> {
    if (this._shouldThrowOnUpload) {
      throw new Error('Upload failed');
    }
    return {
      storagePath: `bundles/sections/${sectionId}/v${version}`,
      size: 1024,
    };
  }

  async deleteSectionBundle(storagePath: string): Promise<void> {
    this._deletedPaths.push(storagePath);
  }

  getSectionBundleUrl(storagePath: string): string {
    return `http://localhost:8702/static/${storagePath}`;
  }

  async extractSectionManifest(_storagePath: string): Promise<SectionBundleManifest | null> {
    return this._sectionManifest;
  }

  async sectionEntrypointExists(_storagePath: string, _entrypoint: string): Promise<boolean> {
    return this._entrypointExists;
  }

  // === Test Helpers ===

  simulateUploadError(shouldThrow: boolean): void {
    this._shouldThrowOnUpload = shouldThrow;
  }

  setEntrypointExists(exists: boolean): void {
    this._entrypointExists = exists;
  }

  setSectionManifest(manifest: SectionBundleManifest | null): void {
    this._sectionManifest = manifest;
  }

  setManifest(manifest: BundleManifest | null): void {
    this._manifest = manifest;
  }

  getDeletedPaths(): string[] {
    return [...this._deletedPaths];
  }

  clear(): void {
    this._shouldThrowOnUpload = false;
    this._entrypointExists = true;
    this._sectionManifest = null;
    this._manifest = null;
    this._deletedPaths = [];
  }
}
