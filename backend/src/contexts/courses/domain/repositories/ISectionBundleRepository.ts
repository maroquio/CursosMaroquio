import { type IRepository } from '@shared/infrastructure/persistence/IRepository.ts';
import { SectionBundle } from '../entities/SectionBundle.ts';
import { SectionBundleId } from '../value-objects/SectionBundleId.ts';
import { SectionId } from '../value-objects/SectionId.ts';

/**
 * SectionBundle Repository Interface
 * Defines the contract for section bundle persistence operations
 */
export interface ISectionBundleRepository extends IRepository<SectionBundle, SectionBundleId> {
  /**
   * Find all bundles for a specific section
   * Returns bundles sorted by version descending (newest first)
   */
  findBySectionId(sectionId: SectionId): Promise<SectionBundle[]>;

  /**
   * Find the active bundle for a specific section
   * Returns null if no bundle is active
   */
  findActiveBySectionId(sectionId: SectionId): Promise<SectionBundle | null>;

  /**
   * Get the next version number for a section's bundles
   * Returns 1 if no bundles exist, otherwise max(version) + 1
   */
  getNextVersion(sectionId: SectionId): Promise<number>;

  /**
   * Deactivate all bundles for a specific section
   * Used before activating a new bundle to ensure only one is active
   */
  deactivateAllForSection(sectionId: SectionId): Promise<void>;
}
