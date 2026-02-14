import { type BundleManifest } from '../../domain/entities/LessonBundle.ts';
import { type SectionBundleManifest } from '../../domain/entities/SectionBundle.ts';

/**
 * Result of a successful bundle upload
 */
export interface UploadResult {
  /** Path where the bundle was stored */
  storagePath: string;
  /** Total size of the uploaded content in bytes */
  size: number;
}

/**
 * Storage Service Interface
 * Abstracts the storage mechanism for lesson and section bundles
 * Can be implemented for local filesystem, S3, GCS, etc.
 */
export interface IStorageService {
  // === Lesson Bundle Methods ===

  /**
   * Upload a bundle ZIP file for a lesson
   * Extracts the ZIP contents to the storage location
   *
   * @param lessonId - The ID of the lesson this bundle belongs to
   * @param version - The version number of the bundle
   * @param file - The ZIP file buffer to upload
   * @returns Upload result with storage path and size
   */
  uploadBundle(lessonId: string, version: number, file: Buffer): Promise<UploadResult>;

  /**
   * Delete a bundle from storage
   *
   * @param storagePath - The storage path returned from uploadBundle
   */
  deleteBundle(storagePath: string): Promise<void>;

  /**
   * Get the public URL for accessing a bundle
   *
   * @param storagePath - The storage path returned from uploadBundle
   * @returns The URL to access the bundle content
   */
  getBundleUrl(storagePath: string): string;

  /**
   * Extract and parse the manifest file (lesson.json) from a bundle
   *
   * @param storagePath - The storage path of the bundle
   * @returns The parsed manifest or null if not found
   */
  extractManifest(storagePath: string): Promise<BundleManifest | null>;

  /**
   * Check if the entrypoint file exists in the bundle
   *
   * @param storagePath - The storage path of the bundle
   * @param entrypoint - The entrypoint filename (e.g., 'index.html')
   * @returns True if the entrypoint exists
   */
  entrypointExists(storagePath: string, entrypoint: string): Promise<boolean>;

  // === Section Bundle Methods ===

  /**
   * Upload a bundle ZIP file for a section
   * Extracts the ZIP contents to the storage location
   *
   * @param sectionId - The ID of the section this bundle belongs to
   * @param version - The version number of the bundle
   * @param file - The ZIP file buffer to upload
   * @returns Upload result with storage path and size
   */
  uploadSectionBundle(sectionId: string, version: number, file: Buffer): Promise<UploadResult>;

  /**
   * Delete a section bundle from storage
   *
   * @param storagePath - The storage path returned from uploadSectionBundle
   */
  deleteSectionBundle(storagePath: string): Promise<void>;

  /**
   * Get the public URL for accessing a section bundle
   *
   * @param storagePath - The storage path returned from uploadSectionBundle
   * @returns The URL to access the section bundle content
   */
  getSectionBundleUrl(storagePath: string): string;

  /**
   * Extract and parse the manifest file from a section bundle
   * Tries section.json first, then falls back to lesson.json for backwards compatibility
   *
   * @param storagePath - The storage path of the bundle
   * @returns The parsed manifest or null if not found
   */
  extractSectionManifest(storagePath: string): Promise<SectionBundleManifest | null>;

  /**
   * Check if the entrypoint file exists in the section bundle
   *
   * @param storagePath - The storage path of the bundle
   * @param entrypoint - The entrypoint filename (e.g., 'index.html')
   * @returns True if the entrypoint exists
   */
  sectionEntrypointExists(storagePath: string, entrypoint: string): Promise<boolean>;
}
