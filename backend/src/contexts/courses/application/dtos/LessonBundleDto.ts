import { type BundleManifest } from '../../domain/entities/LessonBundle.ts';

/**
 * LessonBundle DTO for read operations
 */
export interface LessonBundleDto {
  id: string;
  lessonId: string;
  version: number;
  entrypoint: string;
  storagePath: string;
  bundleUrl: string;
  manifestJson: BundleManifest | null;
  isActive: boolean;
  createdAt: string;
}

/**
 * List of bundles for a lesson
 */
export interface LessonBundlesListDto {
  lessonId: string;
  bundles: LessonBundleDto[];
  activeVersion: number | null;
}
