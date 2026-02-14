import { Entity } from '@shared/domain/Entity.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { LessonBundleId } from '../value-objects/LessonBundleId.ts';
import { LessonId } from '../value-objects/LessonId.ts';
import { LessonBundleCreated } from '../events/LessonBundleCreated.ts';
import { LessonBundleActivated } from '../events/LessonBundleActivated.ts';

/**
 * Bundle manifest structure
 * Contains metadata about the lesson bundle
 */
export interface BundleManifest {
  lessonId?: string;
  version?: string;
  entrypoint?: string;
  steps?: Array<{ id: string; title: string; type: string }>;
  activities?: string[];
  capabilities?: string[];
}

interface LessonBundleProps {
  lessonId: LessonId;
  version: number;
  entrypoint: string;
  storagePath: string;
  manifestJson: BundleManifest | null;
  isActive: boolean;
  createdAt: Date;
}

/**
 * LessonBundle Entity
 * Represents a versioned bundle of static content (HTML/CSS/JS) for a lesson
 * Supports rollback by activating different versions
 */
export class LessonBundle extends Entity<LessonBundleId> {
  private props: LessonBundleProps;

  private constructor(id: LessonBundleId, props: LessonBundleProps) {
    super(id);
    this.props = props;
  }

  /**
   * Create a new lesson bundle
   */
  public static create(
    lessonId: LessonId,
    version: number,
    storagePath: string,
    manifestJson?: BundleManifest | null,
    entrypoint?: string
  ): Result<LessonBundle> {
    // Validate version
    if (version < 1) {
      return Result.fail(ErrorCode.BUNDLE_VERSION_INVALID);
    }

    // Validate storage path
    if (!storagePath || storagePath.trim().length === 0) {
      return Result.fail(ErrorCode.BUNDLE_STORAGE_PATH_EMPTY);
    }

    const bundle = new LessonBundle(LessonBundleId.create(), {
      lessonId,
      version,
      entrypoint: entrypoint ?? manifestJson?.entrypoint ?? 'index.html',
      storagePath: storagePath.trim(),
      manifestJson: manifestJson ?? null,
      isActive: false,
      createdAt: new Date(),
    });

    bundle.addDomainEvent(new LessonBundleCreated(bundle.id, lessonId, version));

    return Result.ok(bundle);
  }

  /**
   * Reconstruct a lesson bundle from persistence
   */
  public static reconstruct(
    id: LessonBundleId,
    lessonId: LessonId,
    version: number,
    entrypoint: string,
    storagePath: string,
    manifestJson: BundleManifest | null,
    isActive: boolean,
    createdAt: Date
  ): LessonBundle {
    return new LessonBundle(id, {
      lessonId,
      version,
      entrypoint,
      storagePath,
      manifestJson,
      isActive,
      createdAt,
    });
  }

  // Getters
  public getLessonId(): LessonId {
    return this.props.lessonId;
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

  public getManifestJson(): BundleManifest | null {
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
   * Makes it the current active version for the lesson
   */
  public activate(): void {
    if (!this.props.isActive) {
      this.props.isActive = true;
      this.addDomainEvent(new LessonBundleActivated(this.id, this.props.lessonId));
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
      return Result.fail(ErrorCode.CANNOT_DELETE_ACTIVE_BUNDLE);
    }
    return Result.ok(undefined);
  }
}
