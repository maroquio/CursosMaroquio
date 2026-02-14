import { Entity } from '@shared/domain/Entity.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { SectionBundleId } from '../value-objects/SectionBundleId.ts';
import { SectionId } from '../value-objects/SectionId.ts';
import { SectionBundleCreated } from '../events/SectionBundleCreated.ts';
import { SectionBundleActivated } from '../events/SectionBundleActivated.ts';

/**
 * Section Bundle manifest structure
 * Contains metadata about the section bundle
 */
export interface SectionBundleManifest {
  sectionId?: string;
  lessonId?: string; // For backwards compatibility with lesson.json
  version?: string;
  entrypoint?: string;
  steps?: Array<{ id: string; title: string; type: string }>;
  activities?: string[];
  capabilities?: string[];
}

interface SectionBundleProps {
  sectionId: SectionId;
  version: number;
  entrypoint: string;
  storagePath: string;
  manifestJson: SectionBundleManifest | null;
  isActive: boolean;
  createdAt: Date;
}

/**
 * SectionBundle Entity
 * Represents a versioned bundle of static content (HTML/CSS/JS) for a section
 * Supports rollback by activating different versions
 */
export class SectionBundle extends Entity<SectionBundleId> {
  private props: SectionBundleProps;

  private constructor(id: SectionBundleId, props: SectionBundleProps) {
    super(id);
    this.props = props;
  }

  /**
   * Create a new section bundle
   */
  public static create(
    sectionId: SectionId,
    version: number,
    storagePath: string,
    manifestJson?: SectionBundleManifest | null,
    entrypoint?: string
  ): Result<SectionBundle> {
    // Validate version
    if (version < 1) {
      return Result.fail(ErrorCode.BUNDLE_VERSION_INVALID);
    }

    // Validate storage path
    if (!storagePath || storagePath.trim().length === 0) {
      return Result.fail(ErrorCode.BUNDLE_STORAGE_PATH_EMPTY);
    }

    const bundle = new SectionBundle(SectionBundleId.create(), {
      sectionId,
      version,
      entrypoint: entrypoint ?? manifestJson?.entrypoint ?? 'index.html',
      storagePath: storagePath.trim(),
      manifestJson: manifestJson ?? null,
      isActive: false,
      createdAt: new Date(),
    });

    bundle.addDomainEvent(new SectionBundleCreated(bundle.id, sectionId, version));

    return Result.ok(bundle);
  }

  /**
   * Reconstruct a section bundle from persistence
   */
  public static reconstruct(
    id: SectionBundleId,
    sectionId: SectionId,
    version: number,
    entrypoint: string,
    storagePath: string,
    manifestJson: SectionBundleManifest | null,
    isActive: boolean,
    createdAt: Date
  ): SectionBundle {
    return new SectionBundle(id, {
      sectionId,
      version,
      entrypoint,
      storagePath,
      manifestJson,
      isActive,
      createdAt,
    });
  }

  // Getters
  public getSectionId(): SectionId {
    return this.props.sectionId;
  }

  public getVersion(): number {
    return this.props.version;
  }

  public getEntrypoint(): string {
    return this.props.entrypoint;
  }

  public getStoragePath(): string {
    return this.props.storagePath;
  }

  public getManifestJson(): SectionBundleManifest | null {
    return this.props.manifestJson;
  }

  public getIsActive(): boolean {
    return this.props.isActive;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  // Business Logic

  /**
   * Activate this bundle version
   * Makes it the current active version for the section
   */
  public activate(): void {
    if (!this.props.isActive) {
      this.props.isActive = true;
      this.addDomainEvent(new SectionBundleActivated(this.id, this.props.sectionId));
    }
  }

  /**
   * Deactivate this bundle version
   * Used when another version is activated
   */
  public deactivate(): void {
    this.props.isActive = false;
  }

  /**
   * Check if this bundle can be deleted
   * Cannot delete an active bundle
   */
  public canDelete(): Result<void> {
    if (this.props.isActive) {
      return Result.fail(ErrorCode.CANNOT_DELETE_ACTIVE_SECTION_BUNDLE);
    }
    return Result.ok(undefined);
  }
}
