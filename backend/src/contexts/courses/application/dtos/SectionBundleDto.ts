import { type SectionBundleManifest } from '../../domain/entities/SectionBundle.ts';

/**
 * SectionBundle DTO for read operations
 */
export interface SectionBundleDto {
  id: string;
  sectionId: string;
  version: number;
  entrypoint: string;
  storagePath: string;
  bundleUrl: string;
  manifestJson: SectionBundleManifest | null;
  isActive: boolean;
  createdAt: string;
}

/**
 * List of bundles for a section
 */
export interface SectionBundlesListDto {
  sectionId: string;
  bundles: SectionBundleDto[];
  activeVersion: number | null;
}
