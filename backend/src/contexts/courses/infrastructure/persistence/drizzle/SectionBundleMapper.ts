import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { SectionBundle, type SectionBundleManifest } from '../../../domain/entities/SectionBundle.ts';
import { SectionBundleId } from '../../../domain/value-objects/SectionBundleId.ts';
import { SectionId } from '../../../domain/value-objects/SectionId.ts';
import { type SectionBundleSchema } from './schema.ts';

/**
 * SectionBundleMapper
 * Converts between SectionBundle entity and database schema
 */
export class SectionBundleMapper {
  /**
   * Convert SectionBundle entity to database row
   */
  public static toPersistence(bundle: SectionBundle) {
    return {
      id: bundle.getId().toValue(),
      sectionId: bundle.getSectionId().toValue(),
      version: bundle.getVersion(),
      entrypoint: bundle.getEntrypoint(),
      storagePath: bundle.getStoragePath(),
      manifestJson: bundle.getManifestJson(),
      isActive: bundle.getIsActive(),
      createdAt: bundle.getCreatedAt(),
    };
  }

  /**
   * Convert database row to SectionBundle entity
   */
  public static toDomain(raw: SectionBundleSchema): Result<SectionBundle> {
    const bundleIdResult = SectionBundleId.createFromString(raw.id);
    if (bundleIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_SECTION_BUNDLE_ID);
    }

    const sectionIdResult = SectionId.createFromString(raw.sectionId);
    if (sectionIdResult.isFailure) {
      return Result.fail(ErrorCode.INVALID_SECTION_ID);
    }

    const bundle = SectionBundle.reconstruct(
      bundleIdResult.getValue(),
      sectionIdResult.getValue(),
      raw.version,
      raw.entrypoint,
      raw.storagePath,
      raw.manifestJson as SectionBundleManifest | null,
      raw.isActive,
      raw.createdAt
    );

    return Result.ok(bundle);
  }
}
