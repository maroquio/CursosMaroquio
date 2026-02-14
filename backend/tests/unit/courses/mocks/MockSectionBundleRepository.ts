import type { ISectionBundleRepository } from '@courses/domain/repositories/ISectionBundleRepository.ts';
import { SectionBundle } from '@courses/domain/entities/SectionBundle.ts';
import type { SectionBundleId } from '@courses/domain/value-objects/SectionBundleId.ts';
import type { SectionId } from '@courses/domain/value-objects/SectionId.ts';

/**
 * Mock SectionBundleRepository for testing handlers
 * Simulates database operations with in-memory storage
 */
export class MockSectionBundleRepository implements ISectionBundleRepository {
  private bundles: Map<string, SectionBundle> = new Map();
  private _shouldThrowOnSave = false;

  async save(bundle: SectionBundle): Promise<void> {
    if (this._shouldThrowOnSave) {
      throw new Error('Database error');
    }
    this.bundles.set(bundle.getId().toValue(), bundle);
  }

  async findById(id: SectionBundleId): Promise<SectionBundle | null> {
    return this.bundles.get(id.toValue()) ?? null;
  }

  async exists(id: SectionBundleId): Promise<boolean> {
    return this.bundles.has(id.toValue());
  }

  async delete(id: SectionBundleId): Promise<void> {
    this.bundles.delete(id.toValue());
  }

  async findBySectionId(sectionId: SectionId): Promise<SectionBundle[]> {
    const result: SectionBundle[] = [];
    for (const bundle of this.bundles.values()) {
      if (bundle.getSectionId().equals(sectionId)) {
        result.push(bundle);
      }
    }
    // Sort by version descending
    return result.sort((a, b) => b.getVersion() - a.getVersion());
  }

  async findActiveBySectionId(sectionId: SectionId): Promise<SectionBundle | null> {
    for (const bundle of this.bundles.values()) {
      if (bundle.getSectionId().equals(sectionId) && bundle.getIsActive()) {
        return bundle;
      }
    }
    return null;
  }

  async getNextVersion(sectionId: SectionId): Promise<number> {
    let maxVersion = 0;
    for (const bundle of this.bundles.values()) {
      if (bundle.getSectionId().equals(sectionId)) {
        if (bundle.getVersion() > maxVersion) {
          maxVersion = bundle.getVersion();
        }
      }
    }
    return maxVersion + 1;
  }

  async deactivateAllForSection(sectionId: SectionId): Promise<void> {
    for (const bundle of this.bundles.values()) {
      if (bundle.getSectionId().equals(sectionId)) {
        bundle.deactivate();
      }
    }
  }

  // Test helpers
  clear(): void {
    this.bundles.clear();
  }

  addBundle(bundle: SectionBundle): void {
    this.bundles.set(bundle.getId().toValue(), bundle);
  }

  getAll(): SectionBundle[] {
    return Array.from(this.bundles.values());
  }

  simulateSaveError(shouldThrow: boolean): void {
    this._shouldThrowOnSave = shouldThrow;
  }
}
