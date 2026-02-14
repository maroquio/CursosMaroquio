import { Entity } from '@shared/domain/Entity.ts';
import { Result } from '@shared/domain/Result.ts';
import { ErrorCode } from '@shared/domain/errors/ErrorCodes.ts';
import { EnrollmentId } from '../value-objects/EnrollmentId.ts';
import { CourseId } from '../value-objects/CourseId.ts';
import { EnrollmentStatus } from '../value-objects/EnrollmentStatus.ts';
import { UserId } from '@auth/domain/value-objects/UserId.ts';
import { StudentEnrolled } from '../events/StudentEnrolled.ts';
import { EnrollmentCompleted } from '../events/EnrollmentCompleted.ts';
import { EnrollmentCancelled } from '../events/EnrollmentCancelled.ts';

interface EnrollmentProps {
  courseId: CourseId;
  studentId: UserId;
  status: EnrollmentStatus;
  progress: number; // Percentage 0-100
  enrolledAt: Date;
  expiresAt: Date | null;
  lastAccessedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
}

/**
 * Enrollment Aggregate Root
 * Represents a student's enrollment in a course
 */
export class Enrollment extends Entity<EnrollmentId> {
  private props: EnrollmentProps;

  private constructor(id: EnrollmentId, props: EnrollmentProps) {
    super(id);
    this.props = props;
  }

  /**
   * Create a new enrollment
   * Emits StudentEnrolled domain event
   */
  public static create(courseId: CourseId, studentId: UserId, expiresAt?: Date | null): Result<Enrollment> {
    const enrollmentId = EnrollmentId.create();
    const now = new Date();

    const enrollment = new Enrollment(enrollmentId, {
      courseId,
      studentId,
      status: EnrollmentStatus.ACTIVE,
      progress: 0,
      enrolledAt: now,
      expiresAt: expiresAt ?? null,
      lastAccessedAt: now,
      completedAt: null,
      cancelledAt: null,
    });

    // Emit domain event
    enrollment.addDomainEvent(new StudentEnrolled(enrollmentId, courseId, studentId));

    return Result.ok(enrollment);
  }

  /**
   * Reconstruct an enrollment from persistence
   */
  public static reconstruct(
    id: EnrollmentId,
    courseId: CourseId,
    studentId: UserId,
    status: EnrollmentStatus,
    progress: number,
    enrolledAt: Date,
    expiresAt: Date | null,
    lastAccessedAt: Date | null,
    completedAt: Date | null,
    cancelledAt: Date | null
  ): Enrollment {
    return new Enrollment(id, {
      courseId,
      studentId,
      status,
      progress,
      enrolledAt,
      expiresAt,
      lastAccessedAt,
      completedAt,
      cancelledAt,
    });
  }

  // Getters
  public getCourseId(): CourseId {
    return this.props.courseId;
  }

  public getStudentId(): UserId {
    return this.props.studentId;
  }

  public getStatus(): EnrollmentStatus {
    return this.props.status;
  }

  public getProgress(): number {
    return this.props.progress;
  }

  public getEnrolledAt(): Date {
    return this.props.enrolledAt;
  }

  public getExpiresAt(): Date | null {
    return this.props.expiresAt;
  }

  public getLastAccessedAt(): Date | null {
    return this.props.lastAccessedAt;
  }

  public getCompletedAt(): Date | null {
    return this.props.completedAt;
  }

  public getCancelledAt(): Date | null {
    return this.props.cancelledAt;
  }

  public isExpired(): boolean {
    if (!this.props.expiresAt) return false;
    return new Date() > this.props.expiresAt;
  }

  public isActive(): boolean {
    return this.props.status === EnrollmentStatus.ACTIVE;
  }

  public isCompleted(): boolean {
    return this.props.status === EnrollmentStatus.COMPLETED;
  }

  public isCancelled(): boolean {
    return this.props.status === EnrollmentStatus.CANCELLED;
  }

  // Business Logic

  /**
   * Update expiration date
   */
  public updateExpiresAt(expiresAt: Date | null): void {
    this.props.expiresAt = expiresAt;
  }

  /**
   * Update last accessed timestamp
   */
  public updateLastAccessedAt(): void {
    this.props.lastAccessedAt = new Date();
  }

  /**
   * Update progress percentage
   */
  public updateProgress(progress: number): Result<void> {
    if (!this.isActive()) {
      return Result.fail(ErrorCode.ENROLLMENT_NOT_ACTIVE);
    }

    // Clamp progress between 0 and 100
    this.props.progress = Math.max(0, Math.min(100, progress));

    // Auto-complete if progress reaches 100%
    if (this.props.progress === 100) {
      return this.complete();
    }

    return Result.ok(undefined);
  }

  /**
   * Mark enrollment as completed
   */
  public complete(): Result<void> {
    if (this.props.status === EnrollmentStatus.COMPLETED) {
      return Result.fail(ErrorCode.ENROLLMENT_ALREADY_COMPLETED);
    }

    if (this.props.status === EnrollmentStatus.CANCELLED) {
      return Result.fail(ErrorCode.ENROLLMENT_ALREADY_CANCELLED);
    }

    this.props.status = EnrollmentStatus.COMPLETED;
    this.props.progress = 100;
    this.props.completedAt = new Date();

    this.addDomainEvent(new EnrollmentCompleted(this.id, this.props.courseId, this.props.studentId));

    return Result.ok(undefined);
  }

  /**
   * Cancel the enrollment
   */
  public cancel(): Result<void> {
    if (this.props.status === EnrollmentStatus.CANCELLED) {
      return Result.fail(ErrorCode.ENROLLMENT_ALREADY_CANCELLED);
    }

    if (this.props.status === EnrollmentStatus.COMPLETED) {
      return Result.fail(ErrorCode.ENROLLMENT_ALREADY_COMPLETED);
    }

    this.props.status = EnrollmentStatus.CANCELLED;
    this.props.cancelledAt = new Date();

    this.addDomainEvent(new EnrollmentCancelled(this.id, this.props.courseId, this.props.studentId));

    return Result.ok(undefined);
  }
}
