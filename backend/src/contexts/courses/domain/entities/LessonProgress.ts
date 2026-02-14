import { Entity } from '@shared/domain/Entity.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { EnrollmentId } from '../value-objects/EnrollmentId.ts';
import { LessonId } from '../value-objects/LessonId.ts';
import { LessonProgressStatus } from '../value-objects/LessonProgressStatus.ts';
import { LessonCompleted } from '../events/LessonCompleted.ts';
import { v7 as uuidv7 } from 'uuid';

interface LessonProgressProps {
  enrollmentId: EnrollmentId;
  lessonId: LessonId;
  status: LessonProgressStatus;
  watchedSeconds: number;
  completedAt: Date | null;
  lastWatchedAt: Date | null;
}

/**
 * LessonProgress Entity
 * Tracks a student's progress on a specific lesson
 */
export class LessonProgress extends Entity<LessonId> {
  private props: LessonProgressProps;
  private _id: string;

  private constructor(id: string, lessonId: LessonId, props: LessonProgressProps) {
    super(lessonId);
    this._id = id;
    this.props = props;
  }

  /**
   * Create a new lesson progress entry
   */
  public static create(enrollmentId: EnrollmentId, lessonId: LessonId): Result<LessonProgress> {
    const progress = new LessonProgress(uuidv7(), lessonId, {
      enrollmentId,
      lessonId,
      status: LessonProgressStatus.NOT_STARTED,
      watchedSeconds: 0,
      completedAt: null,
      lastWatchedAt: null,
    });

    return Result.ok(progress);
  }

  /**
   * Reconstruct from persistence
   */
  public static reconstruct(
    id: string,
    enrollmentId: EnrollmentId,
    lessonId: LessonId,
    status: LessonProgressStatus,
    watchedSeconds: number,
    completedAt: Date | null,
    lastWatchedAt: Date | null
  ): LessonProgress {
    return new LessonProgress(id, lessonId, {
      enrollmentId,
      lessonId,
      status,
      watchedSeconds,
      completedAt,
      lastWatchedAt,
    });
  }

  // Getters
  public getProgressId(): string {
    return this._id;
  }

  public getEnrollmentId(): EnrollmentId {
    return this.props.enrollmentId;
  }

  public getLessonId(): LessonId {
    return this.props.lessonId;
  }

  public getStatus(): LessonProgressStatus {
    return this.props.status;
  }

  public getWatchedSeconds(): number {
    return this.props.watchedSeconds;
  }

  public getCompletedAt(): Date | null {
    return this.props.completedAt;
  }

  public getLastWatchedAt(): Date | null {
    return this.props.lastWatchedAt;
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
   * Update watched time
   */
  public updateWatchedTime(seconds: number): Result<void> {
    if (seconds < 0) {
      return Result.fail(ErrorCode.PROGRESS_INVALID_WATCH_TIME);
    }

    if (this.isCompleted()) {
      // Already completed, just update last watched
      this.props.lastWatchedAt = new Date();
      return Result.ok(undefined);
    }

    // Update status to in progress if not started
    if (this.isNotStarted() && seconds > 0) {
      this.props.status = LessonProgressStatus.IN_PROGRESS;
    }

    this.props.watchedSeconds = seconds;
    this.props.lastWatchedAt = new Date();

    return Result.ok(undefined);
  }

  /**
   * Mark lesson as completed
   */
  public complete(): Result<void> {
    if (this.isCompleted()) {
      return Result.fail(ErrorCode.PROGRESS_ALREADY_COMPLETED);
    }

    this.props.status = LessonProgressStatus.COMPLETED;
    this.props.completedAt = new Date();
    this.props.lastWatchedAt = new Date();

    this.addDomainEvent(new LessonCompleted(
      this.props.enrollmentId,
      this.props.lessonId
    ));

    return Result.ok(undefined);
  }

  /**
   * Reset progress (for re-watching)
   */
  public reset(): void {
    this.props.status = LessonProgressStatus.NOT_STARTED;
    this.props.watchedSeconds = 0;
    this.props.completedAt = null;
    this.props.lastWatchedAt = null;
  }
}
