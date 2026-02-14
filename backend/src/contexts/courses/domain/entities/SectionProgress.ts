import { Entity } from '@shared/domain/Entity.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { SectionProgressId } from '../value-objects/SectionProgressId.ts';
import { EnrollmentId } from '../value-objects/EnrollmentId.ts';
import { SectionId } from '../value-objects/SectionId.ts';
import { LessonProgressStatus } from '../value-objects/LessonProgressStatus.ts';
import { SectionCompleted } from '../events/SectionCompleted.ts';

interface SectionProgressProps {
  enrollmentId: EnrollmentId;
  sectionId: SectionId;
  status: LessonProgressStatus;
  completedAt: Date | null;
  lastViewedAt: Date | null;
}

/**
 * SectionProgress Entity
 * Tracks a student's progress on a single section within a lesson
 */
export class SectionProgress extends Entity<SectionProgressId> {
  private props: SectionProgressProps;

  private constructor(id: SectionProgressId, props: SectionProgressProps) {
    super(id);
    this.props = props;
  }

  /**
   * Create a new section progress record
   */
  public static create(
    enrollmentId: EnrollmentId,
    sectionId: SectionId
  ): Result<SectionProgress> {
    const sectionProgress = new SectionProgress(SectionProgressId.create(), {
      enrollmentId,
      sectionId,
      status: LessonProgressStatus.NOT_STARTED,
      completedAt: null,
      lastViewedAt: null,
    });

    return Result.ok(sectionProgress);
  }

  /**
   * Reconstruct a section progress from persistence
   */
  public static reconstruct(
    id: SectionProgressId,
    enrollmentId: EnrollmentId,
    sectionId: SectionId,
    status: LessonProgressStatus,
    completedAt: Date | null,
    lastViewedAt: Date | null
  ): SectionProgress {
    return new SectionProgress(id, {
      enrollmentId,
      sectionId,
      status,
      completedAt,
      lastViewedAt,
    });
  }

  // Getters
  public getEnrollmentId(): EnrollmentId {
    return this.props.enrollmentId;
  }

  public getSectionId(): SectionId {
    return this.props.sectionId;
  }

  public getStatus(): LessonProgressStatus {
    return this.props.status;
  }

  public getCompletedAt(): Date | null {
    return this.props.completedAt;
  }

  public getLastViewedAt(): Date | null {
    return this.props.lastViewedAt;
  }

  public isCompleted(): boolean {
    return this.props.status === LessonProgressStatus.COMPLETED;
  }

  public isInProgress(): boolean {
    return this.props.status === LessonProgressStatus.IN_PROGRESS;
  }

  public isNotStarted(): boolean {
    return this.props.status === LessonProgressStatus.NOT_STARTED;
  }

  // Business Logic

  /**
   * Mark the section as started (in progress)
   */
  public start(): Result<void> {
    if (this.props.status === LessonProgressStatus.COMPLETED) {
      return Result.ok(undefined); // Already completed, no change needed
    }

    this.props.status = LessonProgressStatus.IN_PROGRESS;
    this.props.lastViewedAt = new Date();
    return Result.ok(undefined);
  }

  /**
   * Mark the section as viewed (updates last viewed timestamp)
   */
  public markViewed(): void {
    this.props.lastViewedAt = new Date();
    if (this.props.status === LessonProgressStatus.NOT_STARTED) {
      this.props.status = LessonProgressStatus.IN_PROGRESS;
    }
  }

  /**
   * Mark the section as completed
   */
  public complete(): Result<void> {
    if (this.props.status === LessonProgressStatus.COMPLETED) {
      return Result.fail(ErrorCode.SECTION_PROGRESS_ALREADY_COMPLETED);
    }

    this.props.status = LessonProgressStatus.COMPLETED;
    this.props.completedAt = new Date();
    this.props.lastViewedAt = new Date();

    // Emit domain event
    this.addDomainEvent(new SectionCompleted(
      this.props.enrollmentId,
      this.props.sectionId
    ));

    return Result.ok(undefined);
  }

  /**
   * Reset progress (for testing or admin purposes)
   */
  public reset(): void {
    this.props.status = LessonProgressStatus.NOT_STARTED;
    this.props.completedAt = null;
    this.props.lastViewedAt = null;
  }
}
